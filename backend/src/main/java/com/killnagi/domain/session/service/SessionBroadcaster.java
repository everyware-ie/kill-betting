package com.killnagi.domain.session.service;

import com.killnagi.domain.match.event.MatchConfirmedEvent;
import com.killnagi.domain.match.event.MatchDeletedEvent;
import com.killnagi.domain.scoreboard.dto.ScoreBoardUpdateMessage;
import com.killnagi.domain.session.dto.response.SessionEndMessage;
import com.killnagi.domain.session.dto.response.SessionMessage;
import com.killnagi.domain.session.dto.response.SessionMessage.Type;
import com.killnagi.domain.session.event.SessionEndEvent;
import com.killnagi.infra.redis.RedisMessagePublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionBroadcaster {

    private static final String TOPIC_PREFIX = "/topic/sessions/";

    private final RedisMessagePublisher messagePublisher;

    public void broadcastSessionStarted(Long sessionId) {
        send(sessionId, Type.SESSION_STARTED, null);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMatchConfirmed(MatchConfirmedEvent event) {
        ScoreBoardUpdateMessage message = ScoreBoardUpdateMessage.from(event);

        log.info("스코어보드 브로드캐스트: sessionId={}, matchNumber={}, team={}",
                event.sessionId(), event.matchNumber(), event.teamSnapshot().teamName());

        send(event.sessionId(), Type.SCORE_UPDATED, message);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMatchDeleted(MatchDeletedEvent event) {
        ScoreBoardUpdateMessage message = ScoreBoardUpdateMessage.from(event);

        log.info("매치 삭제 브로드캐스트: sessionId={}, matchNumber={}, team={}",
                event.sessionId(), event.matchNumber(), event.teamSnapshot().teamName());

        send(event.sessionId(), Type.SCORE_UPDATED, message);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSessionEnd(SessionEndEvent event) {
        SessionEndMessage message = SessionEndMessage.from(event);

        log.info("세션 종료 브로드캐스트: sessionId={}, reason={}, winner={}",
                event.sessionId(), event.reason(),
                event.isDraw() ? "DRAW" : event.winnerTeamName());

        send(event.sessionId(), Type.SESSION_ENDED, message);
    }

    public void broadcastAdjustmentApplied(Long sessionId, Object data) {
        send(sessionId, Type.ADJUSTMENT_APPLIED, data);
    }

    public void broadcastSessionRenewed(Long originalSessionId, Object data) {
        send(originalSessionId, Type.SESSION_RENEWED, data);
    }

    private void send(Long sessionId, Type type, Object data) {
        messagePublisher.publish(TOPIC_PREFIX + sessionId, new SessionMessage(type, data));
    }
}
