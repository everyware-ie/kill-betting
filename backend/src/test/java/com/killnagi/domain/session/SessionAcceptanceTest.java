package com.killnagi.domain.session;

import com.fasterxml.jackson.databind.JsonNode;
import com.killnagi.support.AcceptanceTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Session 인수 테스트")
class SessionAcceptanceTest extends AcceptanceTestSupport {

    @Test
    void 호스트가_세션을_생성하면_roomUrl을_발급받는다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");

        // When
        ResponseEntity<String> response = post("/api/sessions",
                toJson(Map.of("name", "킬내기 세션", "targetKills", 50, "timeLimitMinutes", 60, "rules", List.of())),
                hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(parseBody(response).at("/data/roomUrl").asText()).isNotBlank();
        assertThat(parseBody(response).at("/data/status").asText()).isEqualTo("WAITING");
    }

    @Test
    void roomUrl로_세션_정보를_조회할_수_있다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        JsonNode created = parseBody(post("/api/sessions",
                toJson(Map.of("name", "킬내기 세션", "targetKills", 50, "timeLimitMinutes", 60, "rules", List.of())),
                hostToken));
        String roomUrl = created.at("/data/roomUrl").asText();

        // When
        ResponseEntity<String> response = get("/api/sessions/join/" + roomUrl, hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/name").asText()).isEqualTo("킬내기 세션");
    }

    @Test
    void 내가_생성한_세션_목록을_조회할_수_있다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        세션을_생성한다(hostToken, "첫 번째 세션");
        세션을_생성한다(hostToken, "두 번째 세션");

        // When
        ResponseEntity<String> response = get("/api/sessions/my", hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).get("data").size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void 팀이_2개_이상이면_세션을_시작할_수_있다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        팀을_생성한다(sessionId, "팀A", hostToken);
        팀을_생성한다(sessionId, "팀B", hostToken);

        // When
        post("/api/sessions/" + sessionId + "/start", toJson(Map.of()), hostToken);

        // Then
        ResponseEntity<String> scoreboard = get("/api/sessions/" + sessionId + "/scoreboard", hostToken);
        assertThat(parseBody(scoreboard).at("/data/status").asText()).isEqualTo("IN_PROGRESS");
    }

    @Test
    void 세션의_스코어보드를_조회할_수_있다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);

        // When
        ResponseEntity<String> response = get("/api/sessions/" + sessionId + "/scoreboard", hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/sessionId").asLong()).isEqualTo(sessionId);
    }

    @Test
    void 세션의_매치_히스토리를_조회할_수_있다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);

        // When
        ResponseEntity<String> response = get("/api/sessions/" + sessionId + "/match-history", hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/confirmedMatchCount").asInt()).isZero();
    }
}