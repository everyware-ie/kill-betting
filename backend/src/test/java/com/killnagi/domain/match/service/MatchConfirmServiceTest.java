package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.Rule.RuleType;
import com.killnagi.domain.rule.entity.Rule.Operator;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchConfirmService 매치 결과 확정 테스트")
class MatchConfirmServiceTest {

    @Mock
    private MatchRepository matchRepository;
    @Mock
    private MatchResultRepository matchResultRepository;
    @Mock
    private RuleRepository ruleRepository;
    @Mock
    private TeamRepository teamRepository;
    @InjectMocks
    private MatchConfirmService matchConfirmService;

    private static final Long MATCH_ID = 1L;
    private static final Long SESSION_ID = 1L;
    private static final Long USER_ID = 1L;

    private Match pendingMatch;
    private Team team;
    private TeamPlayer player;
    private MatchResult result;

    @BeforeEach
    void setUp() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        team = TestFixtures.team(session);
        player = TestFixtures.player(team);
        pendingMatch = TestFixtures.match(MATCH_ID, session);
        result = TestFixtures.matchResult(pendingMatch, player, 5, 3);
    }

    @Test
    void 매치가_존재하지_않으면_NotFound_예외가_발생한다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("매치를 찾을 수 없습니다.");
    }

    @Test
    void 이미_확정된_매치는_다시_확정할_수_없다() {
        pendingMatch.confirm();
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 확정된 매치입니다.");
    }

    @Test
    void Operator_권한이_없는_사용자는_확정할_수_없다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(false);

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("업로더 권한이 있는 사용자만 결과를 확정할 수 있습니다.");
    }

    @Test
    void 매치_결과_데이터가_없으면_확정할_수_없다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of());

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("확정할 매치 결과가 없습니다.");
    }

    @Test
    void 확정_성공시_팀의_총_킬수가_누적된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 확정_성공시_팀원의_총_킬수가_업데이트된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(player.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 치킨_달성시_CHICKEN_BONUS_규칙이_팀_보너스_킬에_적용된다() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        MatchResult chickenResult = TestFixtures.matchResult(pendingMatch, player, 3, 1);
        Rule chickenBonus = TestFixtures.rule(session, RuleType.CHICKEN_BONUS, 3);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(chickenResult));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(chickenBonus));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getBonusKills()).isEqualTo(3);
    }

    @Test
    void TOP10_진입_실패시_SURVIVAL_PENALTY_규칙이_팀_패널티_킬에_적용된다() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        MatchResult lateResult = TestFixtures.matchResult(pendingMatch, player, 2, 11);
        Rule penalty = TestFixtures.rule(session, RuleType.SURVIVAL_PENALTY, 2);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(lateResult));
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(penalty));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getPenaltyKills()).isEqualTo(2);
    }

    @Test
    void 확정_성공시_매치_상태가_CONFIRMED로_변경된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(pendingMatch.isConfirmed()).isTrue();
    }

    @Test
    void 순위_조건_만족시_PLACEMENT_BONUS가_팀_보너스에_적용된다() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        Rule placementBonus = TestFixtures.rule(session, RuleType.PLACEMENT_BONUS, Operator.LTE, 3);
        MatchResult top3Result = MatchResult.builder()
                .match(pendingMatch)
                .teamPlayer(player)
                .kills(4)
                .placement(2)
                .build();

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(top3Result));
        given(teamRepository.existsBySessionIdAndOperatorUserId(SESSION_ID, USER_ID)).willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(placementBonus));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getBonusKills()).isEqualTo(3);
    }
}
