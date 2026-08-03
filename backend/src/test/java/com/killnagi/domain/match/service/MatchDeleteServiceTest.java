package com.killnagi.domain.match.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.Match.MatchConfirmData;
import com.killnagi.domain.match.entity.MatchDeletionLog;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.event.MatchDeletedEvent;
import com.killnagi.domain.match.repository.MatchDeletionLogRepository;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleType;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchDeleteService 매치 삭제 테스트")
class MatchDeleteServiceTest {

    @Mock private MatchRepository matchRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private MatchDeletionLogRepository matchDeletionLogRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private MatchDeleteService matchDeleteService;

    private static final Long MATCH_ID = 1L;
    private static final Long LEADER_ID = 1L;
    private static final Long OTHER_LEADER_ID = 2L;

    private Match confirmedMatch;
    private Team team;
    private User leader;

    @BeforeEach
    void setUp() {
        User host = TestFixtures.user(10L);
        leader = TestFixtures.user(LEADER_ID, "리더", "leader@test.com");
        Session session = TestFixtures.session(host);
        session.start();
        team = TestFixtures.team(session);
        team.assignLeader(leader);
        confirmedMatch = TestFixtures.match(MATCH_ID, session);
        ReflectionTestUtils.setField(confirmedMatch, "team", team);
        confirmedMatch.confirm(List.of(), List.of(), new MatchConfirmData(false, null, 0, null));
    }

    @Test
    void 매치가_존재하지_않으면_NotFound_예외가_발생한다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> matchDeleteService.delete(MATCH_ID, LEADER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("매치를 찾을 수 없습니다.");
    }

    @Test
    void 매치가_속한_팀의_리더가_아니면_삭제할_수_없다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));

        assertThatThrownBy(() -> matchDeleteService.delete(MATCH_ID, OTHER_LEADER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("해당 팀의 리더만 매치를 삭제할 수 있습니다.");
    }

    @Test
    void 세션이_ENDED면_삭제할_수_없다() {
        confirmedMatch.getSession().end(team);
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));

        assertThatThrownBy(() -> matchDeleteService.delete(MATCH_ID, LEADER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("진행 중인 세션의 매치만 삭제할 수 있습니다.");
    }

    @Test
    void 삭제_성공시_팀의_킬수가_역산된다() {
        TeamPlayer player = TestFixtures.player(team, "PlayerOne");
        team.addKills(5);
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of());

        matchDeleteService.delete(MATCH_ID, LEADER_ID);

        assertThat(team.getTotalKills()).isEqualTo(5 - confirmedMatch.getMatchKillCount());
    }

    @Test
    void 삭제_성공시_매치_상태가_DELETED로_변경된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of());

        matchDeleteService.delete(MATCH_ID, LEADER_ID);

        assertThat(confirmedMatch.getStatus()).isEqualTo(com.killnagi.domain.match.entity.MatchStatus.DELETED);
    }

    @Test
    void 삭제_성공시_이벤트가_발행된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of());

        matchDeleteService.delete(MATCH_ID, LEADER_ID);

        ArgumentCaptor<MatchDeletedEvent> captor = ArgumentCaptor.forClass(MatchDeletedEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().matchId()).isEqualTo(MATCH_ID);
    }

    @Test
    void 삭제_성공시_이력이_저장된다() {
        ReflectionTestUtils.setField(team, "id", 100L);
        TeamPlayer player = TestFixtures.player(team, "PlayerOne");
        MatchResult result = TestFixtures.matchResult(confirmedMatch, player, 5);
        Rule chickenBonus = TestFixtures.rule(confirmedMatch.getSession(), RuleType.CHICKEN_BONUS, 3);

        Match pendingMatch = TestFixtures.match(2L, confirmedMatch.getSession());
        ReflectionTestUtils.setField(pendingMatch, "team", team);
        pendingMatch.confirm(List.of(result), List.of(chickenBonus), new MatchConfirmData(true, "에란겔", 1, "20:00"));

        given(matchRepository.findById(2L)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));

        matchDeleteService.delete(2L, LEADER_ID);

        ArgumentCaptor<MatchDeletionLog> captor = ArgumentCaptor.forClass(MatchDeletionLog.class);
        verify(matchDeletionLogRepository).save(captor.capture());
        MatchDeletionLog log = captor.getValue();
        assertThat(log.getMatchId()).isEqualTo(2L);
        assertThat(log.getTeamId()).isEqualTo(100L);
        assertThat(log.getDeletedByUserId()).isEqualTo(LEADER_ID);
        assertThat(log.getRevertedKills()).isEqualTo(5);
        assertThat(log.getRevertedRuleScore()).isEqualTo(3);
    }
}