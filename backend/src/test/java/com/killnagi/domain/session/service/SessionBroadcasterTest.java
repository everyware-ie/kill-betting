package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.then;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.domain.match.event.MatchConfirmedEvent;
import com.killnagi.domain.match.event.MemberSnapshot;
import com.killnagi.domain.match.event.TeamSnapshot;
import com.killnagi.domain.scoreboard.dto.MemberResult;
import com.killnagi.domain.scoreboard.dto.ScoreBoardUpdateMessage;
import com.killnagi.domain.scoreboard.dto.TeamUpdate;
import com.killnagi.domain.session.dto.response.SessionMessage;
import com.killnagi.domain.session.dto.response.SessionMessage.Type;
import com.killnagi.infra.redis.RedisMessagePublisher;

@ExtendWith(MockitoExtension.class)
class SessionBroadcasterTest {

    @Mock
    private RedisMessagePublisher messagePublisher;

    @InjectMocks
    private SessionBroadcaster sessionBroadcaster;

    @Test
    void 매치확정_이벤트_수신시_올바른_세션으로_브로드캐스트한다() {
        MatchConfirmedEvent event = matchConfirmedEventFixture(1L, 5L);

        sessionBroadcaster.handleMatchConfirmed(event);

        ArgumentCaptor<SessionMessage> captor = ArgumentCaptor.forClass(SessionMessage.class);
        then(messagePublisher).should()
                .publish(eq("/topic/sessions/5"), captor.capture());
        assertThat(captor.getValue().type()).isEqualTo(Type.SCORE_UPDATED);
    }

    @Test
    void 매치확정_이벤트의_matchId와_sessionId가_메시지에_포함된다() {
        MatchConfirmedEvent event = matchConfirmedEventFixture(10L, 3L);

        sessionBroadcaster.handleMatchConfirmed(event);

        ArgumentCaptor<SessionMessage> captor = ArgumentCaptor.forClass(SessionMessage.class);
        then(messagePublisher).should()
                .publish(eq("/topic/sessions/3"), captor.capture());
        ScoreBoardUpdateMessage message = (ScoreBoardUpdateMessage) captor.getValue().data();
        assertThat(message.matchId()).isEqualTo(10L);
        assertThat(message.sessionId()).isEqualTo(3L);
    }

    @Test
    void 매치확정_이벤트의_팀_스냅샷이_TeamUpdate로_변환된다() {
        MatchConfirmedEvent event = matchConfirmedEventFixture(1L, 1L);

        sessionBroadcaster.handleMatchConfirmed(event);

        ArgumentCaptor<SessionMessage> captor = ArgumentCaptor.forClass(SessionMessage.class);
        then(messagePublisher).should()
                .publish(eq("/topic/sessions/1"), captor.capture());
        ScoreBoardUpdateMessage msg = (ScoreBoardUpdateMessage) captor.getValue().data();
        TeamUpdate teamUpdate = msg.teamUpdate();
        assertThat(teamUpdate.teamId()).isEqualTo(7L);
        assertThat(teamUpdate.teamName()).isEqualTo("팀A");
        assertThat(teamUpdate.matchKillDelta()).isEqualTo(5);
        assertThat(teamUpdate.totalEffectiveKills()).isEqualTo(20);
        assertThat(teamUpdate.totalBonusKills()).isEqualTo(3);
        assertThat(teamUpdate.totalPenaltyKills()).isEqualTo(1);
    }

    @Test
    void 매치확정_이벤트의_팀원_스냅샷이_MemberResult로_변환된다() {
        MatchConfirmedEvent event = matchConfirmedEventFixture(1L, 1L);

        sessionBroadcaster.handleMatchConfirmed(event);

        ArgumentCaptor<SessionMessage> captor = ArgumentCaptor.forClass(SessionMessage.class);
        then(messagePublisher).should()
                .publish(eq("/topic/sessions/1"), captor.capture());
        ScoreBoardUpdateMessage msg = (ScoreBoardUpdateMessage) captor.getValue().data();
        List<MemberResult> memberResults = msg.memberResults();
        assertThat(memberResults).hasSize(2);

        MemberResult first = memberResults.get(0);
        assertThat(first.memberId()).isEqualTo(100L);
        assertThat(first.nickname()).isEqualTo("플레이어1");
        assertThat(first.kills()).isEqualTo(3);
        assertThat(first.bonusKills()).isEqualTo(1);
        assertThat(first.penaltyKills()).isEqualTo(0);
        assertThat(first.effectiveKills()).isEqualTo(4);
        assertThat(first.cumulativeTotalKills()).isEqualTo(15);
    }

    @Test
    void 매치확정_이벤트의_맵이름과_매치번호가_메시지에_포함된다() {
        MatchConfirmedEvent event = matchConfirmedEventFixture(1L, 1L);

        sessionBroadcaster.handleMatchConfirmed(event);

        ArgumentCaptor<SessionMessage> captor = ArgumentCaptor.forClass(SessionMessage.class);
        then(messagePublisher).should()
                .publish(eq("/topic/sessions/1"), captor.capture());
        ScoreBoardUpdateMessage msg = (ScoreBoardUpdateMessage) captor.getValue().data();
        assertThat(msg.mapName()).isEqualTo("에란겔");
        assertThat(msg.matchNumber()).isEqualTo(3);
    }

    // --- fixtures ---

    private MatchConfirmedEvent matchConfirmedEventFixture(Long matchId, Long sessionId) {
        TeamSnapshot teamSnapshot = new TeamSnapshot(
                7L, "팀A", 5, 20, 3, 1
        );
        List<MemberSnapshot> memberSnapshots = List.of(
                new MemberSnapshot(100L, "플레이어1", 3, 1, 0, 4, 15),
                new MemberSnapshot(101L, "플레이어2", 1, 0, 1, 0, 8)
        );
        return new MatchConfirmedEvent(
                matchId, sessionId, 3, "에란겔",
                LocalDateTime.of(2025, 4, 20, 15, 30),
                teamSnapshot, memberSnapshots
        );
    }
}
