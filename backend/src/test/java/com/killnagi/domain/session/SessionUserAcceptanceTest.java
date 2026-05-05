package com.killnagi.domain.session;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.killnagi.support.AcceptanceTestSupport;

@DisplayName("SessionUser 인수 테스트")
class SessionUserAcceptanceTest extends AcceptanceTestSupport {

    @Test
    void 참가자가_세션에_입장하면_대기석에_합류한다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        String participantToken = 회원가입하고_토큰을_반환한다("player1", "player1@test.com");
        세션에_참가한다(sessionId, participantToken);

        // When
        ResponseEntity<String> response = get("/api/sessions/" + sessionId + "/participants", hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/waitingUsers").size()).isEqualTo(1);
        assertThat(parseBody(response).at("/data/waitingUsers/0/nickname").asText()).isEqualTo("player1");
    }

    @Test
    void 대기석에_있는_참가자가_세션을_나갈_수_있다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        String participantToken = 회원가입하고_토큰을_반환한다("player1", "player1@test.com");
        세션에_참가한다(sessionId, participantToken);

        // When - WebSocket disconnect 시뮬레이션
        세션에서_퇴장한다(sessionId, participantToken);

        // Then
        ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/participants", hostToken);
        assertThat(parseBody(configure).at("/data/waitingUsers").size()).isZero();
    }
}
