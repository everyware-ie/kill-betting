package com.killnagi.domain.session.service;

import com.killnagi.domain.session.dto.response.SessionMessage;
import com.killnagi.domain.session.dto.response.SessionMessage.Type;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionBroadcaster {

    private static final String TOPIC_PREFIX = "/topic/sessions/";

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastSessionStarted(Long sessionId) {
        send(sessionId, Type.SESSION_STARTED, null);
    }

    public void broadcastScoreUpdated(Long sessionId, Object data) {
        send(sessionId, Type.SCORE_UPDATED, data);
    }

    public void broadcastSessionEnded(Long sessionId, Object data) {
        send(sessionId, Type.SESSION_ENDED, data);
    }

    private void send(Long sessionId, Type type, Object data) {
        messagingTemplate.convertAndSend(
                TOPIC_PREFIX + sessionId,
                new SessionMessage(type, data)
        );
    }
}
