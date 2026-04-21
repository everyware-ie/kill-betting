package com.killnagi.domain.scoreboard.service;

import com.killnagi.domain.match.event.MatchConfirmedEvent;
import com.killnagi.domain.scoreboard.dto.ScoreBoardUpdateMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScoreBoardBroadcaster {

    private static final String SCOREBOARD_TOPIC = "/topic/sessions/%d/scoreboard";

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMatchConfirmed(MatchConfirmedEvent event) {
        ScoreBoardUpdateMessage message = ScoreBoardUpdateMessage.from(event);
        String destination = String.format(SCOREBOARD_TOPIC, event.sessionId());

        log.info("스코어보드 브로드캐스트: sessionId={}, matchNumber={}, team={}",
                event.sessionId(), event.matchNumber(), event.teamSnapshot().teamName());

        messagingTemplate.convertAndSend(destination, message);
    }
}
