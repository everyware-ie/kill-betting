package com.killnagi.domain.session.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("세션 참가자 레지스트리")
class SessionParticipantRegistryTest {

    private final SessionParticipantRegistry registry = new SessionParticipantRegistry();

    @SuppressWarnings("unchecked")
    private Map<Long, ?> sessionParticipants() {
        return (Map<Long, ?>) ReflectionTestUtils.getField(registry, "sessionParticipants");
    }

    @Test
    @DisplayName("참가자가 나가면 참가자 목록에서 빠진다")
    void 참가자가_나가면_목록에서_빠진다() {
        registry.join("ws-1", 1L, 100L);

        registry.leave("ws-1");

        assertThat(registry.getParticipantIds(1L)).isEmpty();
    }

    @Test
    @DisplayName("세션의 마지막 참가자가 나가면 세션 엔트리 자체가 제거된다")
    void 마지막_참가자가_나가면_세션_엔트리가_제거된다() {
        registry.join("ws-1", 1L, 100L);

        registry.leave("ws-1");

        assertThat(sessionParticipants()).doesNotContainKey(1L);
    }

    @Test
    @DisplayName("세션에 다른 참가자가 남아있으면 세션 엔트리는 유지된다")
    void 참가자가_남아있으면_세션_엔트리는_유지된다() {
        registry.join("ws-1", 1L, 100L);
        registry.join("ws-2", 1L, 200L);

        registry.leave("ws-1");

        assertThat(sessionParticipants()).containsKey(1L);
        assertThat(registry.getParticipantIds(1L)).containsExactly(200L);
    }

    @Test
    @DisplayName("등록되지 않은 wsSessionId로 나가도 예외가 발생하지 않는다")
    void 등록되지_않은_wsSessionId로_나가도_예외가_없다() {
        Long sessionId = registry.leave("unknown-ws");

        assertThat(sessionId).isNull();
    }
}
