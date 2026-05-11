package com.killnagi.domain.team;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.killnagi.support.AcceptanceTestSupport;

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
    void 호스트가_팀에_플레이어를_추가하면_구성_상태에_반영된다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);

        // When
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);

        // Then
        JsonNode configure = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken));
        assertThat(configure.at("/data/teams/0/players/0/playerNickname").asText()).isEqualTo("PlayerOne");
    }

    @Test
    void 호스트가_플레이어_닉네임을_수정하면_구성_상태에_반영된다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);
        long playerId = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken))
                .at("/data/teams/0/players/0/playerId").asLong();

        // When
        팀_플레이어_닉네임을_수정한다(sessionId, teamId, playerId, "UpdatedPlayer", hostToken);

        // Then
        JsonNode configure = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken));
        assertThat(configure.at("/data/teams/0/players/0/playerNickname").asText()).isEqualTo("UpdatedPlayer");
    }

    @Test
    void 호스트가_팀에서_플레이어를_제거하면_구성_상태에_반영된다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);
        long playerId = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken))
                .at("/data/teams/0/players/0/playerId").asLong();

        // When
        팀_플레이어를_제거한다(sessionId, teamId, playerId, hostToken);

        // Then
        JsonNode configure = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken));
        assertThat(configure.at("/data/teams/0/players").size()).isZero();
    }

    @Test
    void 호스트가_대기석_참가자를_팀_리더로_배정하면_구성_상태에_반영된다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        String participantToken = 회원가입하고_토큰을_반환한다("player1", "player1@test.com");
        long participantId = 사용자_ID를_조회한다(participantToken);
        세션에_참가한다(sessionId, participantToken);

        // When
        리더를_배정한다(sessionId, teamId, participantId, hostToken);

        // Then
        JsonNode configure = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken));
        assertThat(configure.at("/data/teams/0/leaderNickname").asText()).isEqualTo("player1");
        assertThat(configure.at("/data/waitingUsers").size()).isZero();
    }

    @Test
    void 호스트가_팀_리더를_해제하면_대기석으로_돌아간다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        String participantToken = 회원가입하고_토큰을_반환한다("player1", "player1@test.com");
        long participantId = 사용자_ID를_조회한다(participantToken);
        세션에_참가한다(sessionId, participantToken);
        리더를_배정한다(sessionId, teamId, participantId, hostToken);

        // When
        리더를_해제한다(sessionId, teamId, hostToken);

        // Then
        JsonNode configure = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken));
        assertThat(configure.at("/data/teams/0/leaderNickname").isNull()).isTrue();
        assertThat(configure.at("/data/waitingUsers").size()).isEqualTo(1);
    }

    @Test
    void 팀_상태는_리더와_플레이어가_모두_있으면_READY다() {
        // Given
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        String participantToken = 회원가입하고_토큰을_반환한다("player1", "player1@test.com");
        long participantId = 사용자_ID를_조회한다(participantToken);
        세션에_참가한다(sessionId, participantToken);
        리더를_배정한다(sessionId, teamId, participantId, hostToken);
        플레이어를_추가한다(sessionId, teamId, "InGamePlayer", hostToken);

        // When
        JsonNode configure = parseBody(get("/api/sessions/" + sessionId + "/participants", hostToken));

        // Then
        assertThat(configure.at("/data/teams/0/status").asText()).isEqualTo("READY");
    }
}