package com.killnagi.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.killnagi.common.storage.FileStorageService;
import com.killnagi.infra.ocr.OcrClient;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AcceptanceTestSupport {

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ObjectMapper objectMapper;

    @MockBean
    protected OcrClient ocrClient;

    @MockBean
    protected FileStorageService fileStorageService;

    @Autowired
    private DatabaseCleanup databaseCleanup;

    @BeforeEach
    void cleanUp() {
        databaseCleanup.execute();
    }

    // ── Auth Steps ────────────────────────────────────────────────────────────

    protected String 회원가입하고_토큰을_반환한다(String nickname, String email) {
        String body = """
                {"nickname":"%s","email":"%s","password":"password1!"}
                """.formatted(nickname, email);
        return parseBody(post("/api/auth/signup", body)).at("/data/accessToken").asText();
    }

    protected long 사용자_ID를_조회한다(String token) {
        return parseBody(get("/api/auth/me", token)).at("/data/id").asLong();
    }

    // ── Session Steps ─────────────────────────────────────────────────────────

    protected long 세션을_생성한다(String token) {
        return 세션을_생성한다(token, "킬내기 세션");
    }

    protected long 세션을_생성한다(String token, String name) {
        String body = """
                {"name":"%s","targetKills":50,"timeLimitMinutes":60,"rules":[]}
                """.formatted(name);
        return parseBody(post("/api/sessions", body, token)).at("/data/id").asLong();
    }

    // ── SessionUser Steps ────────────────────────────────────────────────────

    protected void 세션에_참가한다(long sessionId, String token) {
        post("/api/sessions/" + sessionId + "/join", "{}", token);
    }

    // ── Team Steps ────────────────────────────────────────────────────────────

    protected long 팀을_생성한다(long sessionId, String teamName, String token) {
        return parseBody(post("/api/sessions/" + sessionId + "/teams",
                """
                {"name":"%s"}
                """.formatted(teamName), token)).at("/data/id").asLong();
    }

    protected void 플레이어를_추가한다(long sessionId, long teamId, String nickname, String token) {
        post("/api/sessions/" + sessionId + "/teams/" + teamId + "/players",
                """
                {"playerNickname":"%s"}
                """.formatted(nickname), token);
    }

    protected void 리더를_배정한다(long sessionId, long teamId, long userId, String token) {
        put("/api/sessions/" + sessionId + "/teams/" + teamId + "/leader",
                """
                {"userId":%d}
                """.formatted(userId), token);
    }

    // ── Match Steps ───────────────────────────────────────────────────────────

    protected long 매치_이미지를_업로드한다(long sessionId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new ByteArrayResource("fake-image".getBytes()) {
            @Override
            public String getFilename() {
                return "test.jpg";
            }
        });

        return parseBody(restTemplate.postForEntity(
                "/api/sessions/" + sessionId + "/matches",
                new HttpEntity<>(body, headers),
                String.class)).at("/data/matchId").asLong();
    }

    // ── HTTP Helpers ──────────────────────────────────────────────────────────

    protected ResponseEntity<String> post(String url, String body, String token) {
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(body, authHeaders(token)), String.class);
    }

    protected ResponseEntity<String> post(String url, String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(body, headers), String.class);
    }

    protected ResponseEntity<String> get(String url, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(url, HttpMethod.GET,
                new HttpEntity<>(null, headers), String.class);
    }

    protected ResponseEntity<String> delete(String url, String token) {
        return restTemplate.exchange(url, HttpMethod.DELETE,
                new HttpEntity<>(null, authHeaders(token)), String.class);
    }

    protected ResponseEntity<String> patch(String url, String body, String token) {
        return restTemplate.exchange(url, HttpMethod.PATCH,
                new HttpEntity<>(body, authHeaders(token)), String.class);
    }

    protected ResponseEntity<String> put(String url, String body, String token) {
        return restTemplate.exchange(url, HttpMethod.PUT,
                new HttpEntity<>(body, authHeaders(token)), String.class);
    }

    protected HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    protected JsonNode parseBody(ResponseEntity<String> response) {
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("응답 파싱 실패: " + response.getBody(), e);
        }
    }
}