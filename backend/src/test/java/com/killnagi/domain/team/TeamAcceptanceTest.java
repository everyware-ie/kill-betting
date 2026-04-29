package com.killnagi.domain.team;

import com.killnagi.support.AcceptanceTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Team 인수 테스트")
class TeamAcceptanceTest extends AcceptanceTestSupport {

    private String hostToken;
    private long sessionId;

    @BeforeEach
    void 세션을_준비한다() {
        hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        sessionId = 세션을_생성한다(hostToken);
    }

    @Test
    void 호스트가_팀을_생성하면_팀이_등록된다() {
        // When
        ResponseEntity<String> response = post("/api/sessions/" + sessionId + "/teams",
                toJson(Map.of("name", "팀A")), hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(parseBody(response).at("/data/id").asLong()).isPositive();
    }

    @Test
    void 세션에_생성된_팀_목록을_조회할_수_있다() {
        // Given
        팀을_생성한다(sessionId, "팀A", hostToken);
        팀을_생성한다(sessionId, "팀B", hostToken);

        // When
        ResponseEntity<String> response = get("/api/sessions/" + sessionId + "/teams", hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).get("data").size()).isEqualTo(2);
    }

    @Test
    void 호스트가_팀에_플레이어를_추가할_수_있다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);

        // When
        post("/api/sessions/" + sessionId + "/teams/" + teamId + "/players",
                toJson(Map.of("playerNickname", "PlayerOne")), hostToken);

        // Then
        ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/configure", hostToken);
        assertThat(parseBody(configure).at("/data/teams/0/players/0/playerNickname").asText()).isEqualTo("PlayerOne");
    }

    @Test
    void 호스트가_플레이어_닉네임을_수정할_수_있다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);
        long playerId = parseBody(get("/api/sessions/" + sessionId + "/configure", hostToken))
                .at("/data/teams/0/players/0/playerId").asLong();

        // When
        patch("/api/sessions/" + sessionId + "/teams/" + teamId + "/players/" + playerId,
                toJson(Map.of("playerNickname", "UpdatedPlayer")), hostToken);

        // Then
        ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/configure", hostToken);
        assertThat(parseBody(configure).at("/data/teams/0/players/0/playerNickname").asText()).isEqualTo("UpdatedPlayer");
    }

    @Test
    void 호스트가_팀에서_플레이어를_제거할_수_있다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);
        long playerId = parseBody(get("/api/sessions/" + sessionId + "/configure", hostToken))
                .at("/data/teams/0/players/0/playerId").asLong();

        // When
        delete("/api/sessions/" + sessionId + "/teams/" + teamId + "/players/" + playerId, hostToken);

        // Then
        ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/configure", hostToken);
        assertThat(parseBody(configure).at("/data/teams/0/players").size()).isZero();
    }

    @Test
    void 호스트가_대기석_참가자를_팀_리더로_배정할_수_있다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        String participantToken = 회원가입하고_토큰을_반환한다("player1", "player1@test.com");
        long participantId = 사용자_ID를_조회한다(participantToken);
        세션에_참가한다(sessionId, participantToken);

        // When
        put("/api/sessions/" + sessionId + "/teams/" + teamId + "/leader",
                toJson(Map.of("userId", participantId)), hostToken);

        // Then
        ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/configure", hostToken);
        assertThat(parseBody(configure).at("/data/teams/0/leaderNickname").asText()).isEqualTo("player1");
    }
}