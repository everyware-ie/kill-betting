package com.killnagi.support;

import java.util.List;
import java.util.Map;
import com.killnagi.common.storage.FileStorageService;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.session.service.SessionParticipantRegistry;
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AcceptanceTestSupport {

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected SessionUserRepository sessionUserRepository;

    @Autowired
    private SessionParticipantRegistry registry;

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
        return parseBody(post("/api/auth/signup", toJson(Map.of(
                "nickname", nickname,
                "email", email,
                "password", "password1!")))).at("/data/accessToken").asText();
    }

    protected long 사용자_ID를_조회한다(String token) {
        return parseBody(get("/api/auth/me", token)).at("/data/id").asLong();
    }

    // ── Session Steps ─────────────────────────────────────────────────────────

    protected long 세션을_생성한다(String token) {
        return 세션을_생성한다(token, "킬내기 세션");
    }

    protected long 세션을_생성한다(String token, String name) {
        return parseBody(post("/api/sessions", toJson(Map.of(
                "name", name,
                "targetKills", 50,
                "timeLimitMinutes", 60,
                "rules", List.of())), token)).at("/data/id").asLong();
    }

    // ── SessionUser Steps ────────────────────────────────────────────────────

    // 입장은 WebSocket 구독으로 처리되므로 테스트에서는 레지스트리에 직접 등록
    protected void 세션에_참가한다(long sessionId, String token) {
        Long userId = 사용자_ID를_조회한다(token);
        registry.join("test-ws-" + userId, sessionId, userId);
    }

    protected void 세션에서_퇴장한다(long sessionId, String token) {
        Long userId = 사용자_ID를_조회한다(token);
        registry.removeParticipant(sessionId, userId);
    }

    // ── Team Steps ────────────────────────────────────────────────────────────

    protected long 팀을_생성한다(long sessionId, String teamName, String token) {
        return parseBody(post("/api/sessions/" + sessionId + "/teams",
                toJson(Map.of("name", teamName)), token)).at("/data/id").asLong();
    }

    protected void 플레이어를_추가한다(long sessionId, long teamId, String nickname, String token) {
        post("/api/sessions/" + sessionId + "/teams/" + teamId + "/players",
                toJson(Map.of("playerNickname", nickname)), token);
    }

    protected void 리더를_배정한다(long sessionId, long teamId, long userId, String token) {
        put("/api/sessions/" + sessionId + "/teams/" + teamId + "/leader",
                toJson(Map.of("userId", userId)), token);
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

    protected String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
