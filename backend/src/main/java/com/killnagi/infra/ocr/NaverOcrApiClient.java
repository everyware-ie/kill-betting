package com.killnagi.infra.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
public class NaverOcrApiClient implements OcrClient {

    @Value("${naver.ocr.url}")
    private String url;

    @Value("${naver.ocr.secret-key}")
    private String secretKey;

    private final MeterRegistry meterRegistry;

    public NaverOcrApiClient(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public MatchOcrResult parseMatchScreenshot(MultipartFile file, String imageFormat) {
        log.info("OCR 호출 시작");
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            ObjectMapper mapper = new ObjectMapper();
            String response = callOcrApi(file, imageFormat, mapper);
            MatchOcrResult result = parseOcrResponse(response, mapper);
            sample.stop(Timer.builder("ocr.request.duration").tag("result", "success").register(meterRegistry));
            meterRegistry.counter("ocr.request", "result", "success").increment();
            return result;
        } catch (Exception e) {
            log.error("OCR API 호출 실패", e);
            sample.stop(Timer.builder("ocr.request.duration").tag("result", "failure").register(meterRegistry));
            meterRegistry.counter("ocr.request", "result", "failure").increment();
            return null;
        }
    }

    private String callOcrApi(MultipartFile file, String imageFormat, ObjectMapper mapper) throws IOException {
        URL requestUrl = new URL(this.url);
        HttpURLConnection con = (HttpURLConnection) requestUrl.openConnection();
        con.setUseCaches(false);
        con.setDoInput(true);
        con.setDoOutput(true);
        con.setReadTimeout(30000);
        con.setRequestMethod("POST");

        String boundary = "----" + UUID.randomUUID().toString().replaceAll("-", "");
        con.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        con.setRequestProperty("X-OCR-SECRET", secretKey);

        ObjectNode json = mapper.createObjectNode();
        json.put("version", "V2");
        json.put("requestId", UUID.randomUUID().toString());
        json.put("timestamp", System.currentTimeMillis());

        ObjectNode image = mapper.createObjectNode();
        image.put("format", imageFormat);
        image.put("name", "demo");
        ArrayNode images = mapper.createArrayNode();
        images.add(image);
        json.set("images", images);

        con.connect();
        DataOutputStream wr = new DataOutputStream(con.getOutputStream());
        writeMultiPart(wr, mapper.writeValueAsString(json), file, boundary);
        wr.close();

        int responseCode = con.getResponseCode();
        BufferedReader br = responseCode == 200
                ? new BufferedReader(new InputStreamReader(con.getInputStream()))
                : new BufferedReader(new InputStreamReader(con.getErrorStream()));

        StringBuilder response = new StringBuilder();
        String inputLine;
        while ((inputLine = br.readLine()) != null) {
            response.append(inputLine);
        }
        br.close();

        log.info("OCR 응답: {}", response);
        return response.toString();
    }

    private static List<OcrField> extractFields(String response, ObjectMapper mapper) throws IOException {
        JsonNode root = mapper.readTree(response);
        JsonNode fields = root.path("images").get(0).path("fields");

        List<OcrField> ocrFields = new ArrayList<>();
        for (JsonNode field : fields) {
            String text = field.path("inferText").asText();
            double x = field.path("boundingPoly").path("vertices").get(0).path("x").asDouble();
            double y = field.path("boundingPoly").path("vertices").get(0).path("y").asDouble();
            ocrFields.add(new OcrField(text, x, y));
        }
        return ocrFields;
    }

    private static MatchOcrResult parseOcrResponse(String response, ObjectMapper mapper) throws IOException {
        JsonNode root = mapper.readTree(response);
        JsonNode imageNode = root.path("images").get(0);

        double imageWidth = imageNode.path("convertedImageInfo").path("width").asDouble(0);
        double imageHeight = imageNode.path("convertedImageInfo").path("height").asDouble(0);

        List<OcrField> ocrFields = extractFields(response, mapper);

        if (imageWidth == 0 || imageHeight == 0) {
            imageWidth = ocrFields.stream().mapToDouble(OcrField::getX).max().orElse(1920);
            imageHeight = ocrFields.stream().mapToDouble(OcrField::getY).max().orElse(1080);
            log.info("이미지 크기 추정 - width: {}, height: {}", (int) imageWidth, (int) imageHeight);
        } else {
            log.info("이미지 크기 - width: {}, height: {}", (int) imageWidth, (int) imageHeight);
        }

        // ── 앵커 탐색 (킬/피해량/어시스트) ──────────────────────────
        double killY = -1, damageY = -1, assistY = -1;
        for (OcrField f : ocrFields) {
            String text = f.getText().trim();
            if (text.equals("킬") && killY == -1) killY = f.getY();
            else if ((text.equals("피해량") || text.equals("피 해량")) && damageY == -1) damageY = f.getY();
            else if (text.equals("어시스트") && assistY == -1) assistY = f.getY();
        }
        log.info("앵커 y좌표 - 킬: {}, 피해량: {}, 어시스트: {}", killY, damageY, assistY);

        final double finalImageWidth = imageWidth;
        final double finalImageHeight = imageHeight;
        final double Y_THRESHOLD = imageHeight * 0.04;
        final double sectionWidth = imageWidth / 4.0;

        // ── 스탯 슬롯 기반 수집 ──────────────────────────────────────
        int[] killSlots   = collectStatBySlot(ocrFields, killY,   Y_THRESHOLD, sectionWidth);
        int[] damageSlots = collectStatBySlot(ocrFields, damageY, Y_THRESHOLD, sectionWidth);
        int[] assistSlots = collectStatBySlot(ocrFields, assistY, Y_THRESHOLD, sectionWidth);

        log.info("킬 슬롯:     [{}, {}, {}, {}]", killSlots[0],   killSlots[1],   killSlots[2],   killSlots[3]);
        log.info("피해량 슬롯: [{}, {}, {}, {}]", damageSlots[0], damageSlots[1], damageSlots[2], damageSlots[3]);
        log.info("어시스트 슬롯:[{}, {}, {}, {}]", assistSlots[0], assistSlots[1], assistSlots[2], assistSlots[3]);

        // ── Lv.XXX 필드 수집 ─────────────────────────────────────────
        List<OcrField> lvFields = ocrFields.stream()
                .filter(f -> f.getText().matches("(?i)lv\\.?\\d+"))
                .sorted(Comparator.comparingDouble(OcrField::getX))
                .collect(Collectors.toList());

        log.info("Lv 필드들: {}", lvFields.stream()
                .map(f -> String.format("%s (%.0f, %.0f)", f.getText(), f.getX(), f.getY()))
                .collect(Collectors.toList()));

        if (lvFields.size() < 4) {
            log.info("Lv 필드 {}개 감지, 쪼개진 케이스 병합 시도", lvFields.size());
            lvFields = mergeSplitLvFields(ocrFields, imageWidth, imageHeight);
            log.info("병합 후 Lv 필드들: {}", lvFields.stream()
                    .map(f -> String.format("%s (%.0f, %.0f)", f.getText(), f.getX(), f.getY()))
                    .collect(Collectors.toList()));
        }

        // ── 닉네임 슬롯 기반 수집 ────────────────────────────────────
        String[] nicknameSlots = {"unknown", "unknown", "unknown", "unknown"};

        for (OcrField lv : lvFields) {
            int slot = Math.min((int) (lv.getX() / sectionWidth), 3);
            String nickname = findNickname(ocrFields, lv.getX(), lv.getY(), finalImageWidth, finalImageHeight);
            nicknameSlots[slot] = nickname;
            log.info("Lv({}) → 슬롯 {}, 닉네임: {}", lv.getText(), slot, nickname);
        }

        // ── 조합 (빈 슬롯 스킵) ──────────────────────────────────────
        List<PlayerStat> playerStats = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            boolean isEmpty = nicknameSlots[i].equals("unknown")
                    && killSlots[i] == 0
                    && damageSlots[i] == 0
                    && assistSlots[i] == 0;
            if (isEmpty) continue;

            playerStats.add(PlayerStat.builder()
                    .nickname(nicknameSlots[i])
                    .kills(killSlots[i])
                    .damage(damageSlots[i])
                    .assists(assistSlots[i])
                    .build());
        }

        // ── 매치 메타 정보 파싱 ──────────────────────────────────────
        int placement = parsePlacement(ocrFields);
        String mapName = parseMapName(ocrFields);
        String playTime = parsePlayTime(ocrFields);

        log.info("매치 메타 - 등수: {}, 맵: {}, 플레이 시간: {}", placement, mapName, playTime);

        return MatchOcrResult.builder()
                .placement(placement)
                .mapName(mapName)
                .playTime(playTime)
                .playerStats(playerStats)
                .build();
    }

    // ── 등수 파싱: "#17/27" 또는 "#17" 패턴에서 # 뒤 숫자 추출 ──────
    private static int parsePlacement(List<OcrField> ocrFields) {
        for (OcrField f : ocrFields) {
            String text = f.getText().trim();
            if (text.matches("#\\d+(/\\d+)?")) {
                String numStr = text.substring(1);
                if (numStr.contains("/")) {
                    numStr = numStr.substring(0, numStr.indexOf("/"));
                }
                int placement = parseIntSafe(numStr);
                log.info("등수 파싱 성공: {}", placement);
                return placement;
            }
        }
        // OCR이 "#" 과 숫자를 분리한 경우: "#" 필드 근처 숫자 탐색
        for (OcrField f : ocrFields) {
            if (f.getText().trim().equals("#")) {
                double hashX = f.getX();
                double hashY = f.getY();
                return ocrFields.stream()
                        .filter(n -> Math.abs(n.getY() - hashY) < 30
                                && n.getX() > hashX
                                && n.getX() - hashX < 200
                                && n.getText().matches("\\d+"))
                        .mapToInt(n -> parseIntSafe(n.getText()))
                        .findFirst()
                        .orElse(0);
            }
        }
        log.warn("등수 파싱 실패");
        return 0;
    }

    // ── 맵 이름 파싱: 알려진 PUBG 맵 이름 목록으로 매칭 ─────────────
    private static final List<String> PUBG_MAP_NAMES = List.of(
            "에란겔", "미라마", "사녹", "비켄디", "카라킨", "테이고", "태이고", "데스턴", "론도", "파라모"
    );

    private static String parseMapName(List<OcrField> ocrFields) {
        for (OcrField f : ocrFields) {
            String text = f.getText().trim();
            if (PUBG_MAP_NAMES.contains(text)) {
                log.info("맵 이름 파싱 성공: {}", text);
                return text;
            }
        }
        log.warn("맵 이름 파싱 실패");
        return "알 수 없음";
    }

    // ── 플레이 시간 파싱: "플레이 시간" 레이블 근처 MM:SS 형식 탐색 ──
    private static String parsePlayTime(List<OcrField> ocrFields) {
        for (OcrField f : ocrFields) {
            String text = f.getText().trim();
            // "플레이 시간 11:16" 처럼 합쳐진 경우
            if (text.contains("플레이") && text.matches(".*\\d+:\\d{2}.*")) {
                String time = extractTimePattern(text);
                if (time != null) {
                    log.info("플레이 시간 파싱 성공 (합쳐진 필드): {}", time);
                    return time;
                }
            }
        }
        // "플레이 시간" 레이블 필드를 찾고 근처에서 시간 값 탐색
        for (OcrField label : ocrFields) {
            if (label.getText().trim().contains("플레이")) {
                double labelY = label.getY();
                String time = ocrFields.stream()
                        .filter(f -> Math.abs(f.getY() - labelY) < 20
                                && f.getText().matches("\\d{1,2}:\\d{2}"))
                        .map(OcrField::getText)
                        .findFirst()
                        .orElse(null);
                if (time != null) {
                    log.info("플레이 시간 파싱 성공 (분리된 필드): {}", time);
                    return time;
                }
            }
        }
        log.warn("플레이 시간 파싱 실패");
        return "00:00";
    }

    private static String extractTimePattern(String text) {
        java.util.regex.Matcher matcher =
                java.util.regex.Pattern.compile("\\d{1,2}:\\d{2}").matcher(text);
        return matcher.find() ? matcher.group() : null;
    }

    private static int[] collectStatBySlot(List<OcrField> ocrFields,
                                           double anchorY, double threshold,
                                           double sectionWidth) {
        int[] slots = {0, 0, 0, 0};
        if (anchorY < 0) return slots;

        ocrFields.stream()
                .filter(f -> Math.abs(f.getY() - anchorY) < threshold && isNumber(f.getText()))
                .forEach(f -> {
                    int slot = Math.min((int) (f.getX() / sectionWidth), 3);
                    slots[slot] = parseIntSafe(f.getText());
                });

        return slots;
    }

    private static String findNickname(List<OcrField> ocrFields,
                                       double lvX, double lvY,
                                       double imageWidth, double imageHeight) {
        double yAbove = imageHeight * 0.05;

        List<OcrField> candidates = searchNickname(ocrFields, lvX, lvY,
                lvX - imageWidth * 0.020,
                lvX - imageWidth * 0.008,
                yAbove);

        if (candidates.isEmpty()) {
            log.info("  1차 탐색 실패, 범위 확장 재시도");
            candidates = searchNickname(ocrFields, lvX, lvY,
                    lvX - imageWidth * 0.030,
                    lvX - imageWidth * 0.005,
                    imageHeight * 0.08);
        }

        String result = candidates.isEmpty() ? "unknown" : candidates.get(0).getText();
        log.info("  → 닉네임: {}", result);
        return result;
    }

    private static List<OcrField> searchNickname(List<OcrField> ocrFields,
                                                 double lvX, double lvY,
                                                 double xMin, double xMax,
                                                 double yAbove) {
        List<OcrField> candidates = ocrFields.stream()
                .filter(f -> f.getX() >= xMin && f.getX() <= xMax)
                .filter(f -> f.getY() >= lvY - yAbove && f.getY() < lvY)
                .filter(f -> f.getText().matches("[A-Za-z0-9_\\-]{3,20}"))
                .filter(f -> !isExcludedWord(f.getText()))
                .sorted(Comparator.comparingDouble(OcrField::getY).reversed())
                .collect(Collectors.toList());

        log.info("  탐색범위 x:[{}~{}] 후보들: {}",
                (int) xMin, (int) xMax,
                candidates.stream()
                        .map(f -> String.format("%s(%.0f,%.0f)", f.getText(), f.getX(), f.getY()))
                        .collect(Collectors.toList()));

        return candidates;
    }

    private static boolean isExcludedWord(String text) {
        String upper = text.toUpperCase();
        return upper.equals("PUBG")
                || upper.equals("PUBGI")
                || upper.equals("LRS")
                || upper.equals("ALL")
                || upper.equals("ACCESS")
                || upper.startsWith("LENCI")
                || upper.startsWith("BALEN")
                || upper.startsWith("LV")
                || upper.matches("LV\\.?\\d+")
                || text.contains(" ");
    }

    private static List<OcrField> mergeSplitLvFields(List<OcrField> ocrFields,
                                                     double imageWidth, double imageHeight) {
        List<OcrField> lvParts = ocrFields.stream()
                .filter(f -> f.getText().matches("(?i)lv\\.?"))
                .collect(Collectors.toList());

        List<OcrField> result = new ArrayList<>();
        double xGap = imageWidth * 0.03;
        double yGap = imageHeight * 0.02;

        for (OcrField lv : lvParts) {
            Optional<OcrField> numPart = ocrFields.stream()
                    .filter(f -> f.getText().matches("\\d{2,3}"))
                    .filter(f -> Math.abs(f.getY() - lv.getY()) < yGap)
                    .filter(f -> f.getX() > lv.getX() && f.getX() - lv.getX() < xGap)
                    .findFirst();

            if (numPart.isPresent()) {
                result.add(new OcrField("Lv." + numPart.get().getText(), lv.getX(), lv.getY()));
            }
        }

        if (result.isEmpty()) {
            return ocrFields.stream()
                    .filter(f -> f.getText().matches("(?i)lv\\.?\\d+"))
                    .sorted(Comparator.comparingDouble(OcrField::getX))
                    .collect(Collectors.toList());
        }

        return result.stream()
                .sorted(Comparator.comparingDouble(OcrField::getX))
                .collect(Collectors.toList());
    }

    private static boolean isNumber(String text) {
        try {
            Integer.parseInt(normalizeOcrText(text));
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static int parseIntSafe(String text) {
        try {
            return Integer.parseInt(normalizeOcrText(text));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static String normalizeOcrText(String text) {
        return text.trim()
                .replace("O", "0")
                .replace("||", "0")
                .replace("l", "1")
                .replace("|", "1");
    }

    private static void writeMultiPart(OutputStream out, String jsonMessage,
                                       MultipartFile file, String boundary) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Disposition:form-data; name=\"message\"\r\n\r\n");
        sb.append(jsonMessage);
        sb.append("\r\n");
        out.write(sb.toString().getBytes("UTF-8"));
        out.flush();

        if (file != null && !file.isEmpty()) {
            out.write(("--" + boundary + "\r\n").getBytes("UTF-8"));
            StringBuilder fileString = new StringBuilder();
            fileString.append("Content-Disposition:form-data; name=\"file\"; filename=");
            fileString.append("\"").append(file.getOriginalFilename()).append("\"\r\n");
            fileString.append("Content-Type: application/octet-stream\r\n\r\n");
            out.write(fileString.toString().getBytes("UTF-8"));
            out.flush();

            try (InputStream is = file.getInputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = is.read(buffer)) != -1) {
                    out.write(buffer, 0, count);
                }
                out.write("\r\n".getBytes());
            }
            out.write(("--" + boundary + "--\r\n").getBytes("UTF-8"));
        }
        out.flush();
    }
}