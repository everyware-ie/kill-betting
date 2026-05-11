package com.killnagi.domain.session.service;

import com.killnagi.domain.session.dto.response.SessionEndMessage;
import com.killnagi.domain.session.event.SessionEndEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionEndBroadcaster {

    private static final String SESSION_END_TOPIC = "/topic/sessions/%d/end";

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSessionEnd(SessionEndEvent event) {
        SessionEndMessage message = SessionEndMessage.from(event);
        String destination = String.format(SESSION_END_TOPIC, event.sessionId());

        log.info("세션 종료 브로드캐스트: sessionId={}, reason={}, winner={}",
                event.sessionId(), event.reason(),
                event.isDraw() ? "DRAW" : event.winnerTeamName());

        messagingTemplate.convertAndSend(destination, message);
    }
}