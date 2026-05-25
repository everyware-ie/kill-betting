package com.killnagi.domain.scoreboard.service;

import com.killnagi.domain.match.event.MatchConfirmedEvent;
import com.killnagi.domain.scoreboard.dto.ScoreBoardUpdateMessage;
import com.killnagi.domain.session.service.SessionBroadcaster;
import com.killnagi.domain.team.event.AdjustmentAppliedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScoreBoardBroadcaster {

    private final SessionBroadcaster sessionBroadcaster;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMatchConfirmed(MatchConfirmedEvent event) {
        ScoreBoardUpdateMessage message = ScoreBoardUpdateMessage.from(event);

        log.info("스코어보드 브로드캐스트: sessionId={}, matchNumber={}, team={}",
                event.sessionId(), event.matchNumber(), event.teamSnapshot().teamName());

        sessionBroadcaster.broadcastScoreUpdated(event.sessionId(), message);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAdjustmentApplied(AdjustmentAppliedEvent event) {
        log.info("조정 브로드캐스트: sessionId={}, teamId={}, amount={}",
                event.sessionId(), event.teamId(), event.amount());

        sessionBroadcaster.broadcastAdjustmentApplied(event.sessionId(), Map.of(
                "teamId", event.teamId(),
                "teamName", event.teamName(),
                "amount", event.amount(),
                "reason", event.reason()
        ));
    }
}
