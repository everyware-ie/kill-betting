package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.Rule.Operator;
import com.killnagi.domain.rule.entity.Rule.RuleType;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.team.repository.TeamMemberRepository;
import com.killnagi.domain.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchConfirmService 매치 결과 확정 테스트")
class MatchConfirmServiceTest {

    @Mock private MatchRepository matchRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @InjectMocks private MatchConfirmService matchConfirmService;

    private static final Long MATCH_ID = 1L;
    private static final Long SESSION_ID = 1L;
    private static final Long USER_ID = 1L;

    private Match pendingMatch;
    private Team team;
    private TeamMember member;
    private MatchResult result;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .nickname("tester").email("test@test.com").password("pw")
                .build();
        ReflectionTestUtils.setField(user, "id", USER_ID);

        Session session = Session.builder()
                .name("킬내기 세션").host(user)
                .build();
        ReflectionTestUtils.setField(session, "id", SESSION_ID);

        team = Team.builder().session(session).name("팀A").build();

        member = TeamMember.builder().team(team).user(user).build();

        pendingMatch = Match.builder().session(session).team(team).matchNumber(1).build();
        ReflectionTestUtils.setField(pendingMatch, "id", MATCH_ID);

        result = MatchResult.builder()
                .match(pendingMatch)
                .teamMember(member)
                .kills(5)
                .placement(3)
                .build();
    }

    @Test
    @DisplayName("매치가 존재하지 않으면 NotFound 예외가 발생한다")
    void should_ThrowNotFound_when_MatchNotExists() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("매치를 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("이미 확정된 매치는 다시 확정할 수 없다")
    void should_ThrowBadRequest_when_MatchAlreadyConfirmed() {
        pendingMatch.confirm();
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 확정된 매치입니다.");
    }

    @Test
    @DisplayName("매치 결과 데이터가 없으면 확정할 수 없다")
    void should_ThrowBadRequest_when_MatchHasNoResults() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of());

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("확정할 매치 결과가 없습니다.");
    }

    @Test
    @DisplayName("업로더 권한이 없는 사용자는 확정할 수 없다")
    void should_ThrowForbidden_when_RequesterIsNotUploader() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(false);

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("업로더 권한이 있는 사용자만 결과를 확정할 수 있습니다.");
    }

    @Test
    @DisplayName("확정 성공 시 팀의 총 킬 수가 누적된다")
    void should_AddKillsToTeam_when_MatchIsConfirmed() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getTotalKills()).isEqualTo(5);
    }

    @Test
    @DisplayName("확정 성공 시 팀 멤버의 총 킬 수가 업데이트된다")
    void should_UpdateTeamMemberKills_when_MatchIsConfirmed() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(member.getTotalKills()).isEqualTo(5);
    }

    @Test
    @DisplayName("치킨 달성 시 CHICKEN_BONUS 규칙이 팀 보너스 킬에 적용된다")
    void should_ApplyChickenBonus_when_TeamGetsChicken() {
        MatchResult chickenResult = MatchResult.builder()
                .match(pendingMatch)
                .teamMember(member)
                .kills(3)
                .placement(1)
                .build();

        Rule chickenBonus = mock(Rule.class);
        given(chickenBonus.getRuleType()).willReturn(RuleType.CHICKEN_BONUS);
        given(chickenBonus.getValue()).willReturn(3);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(chickenResult));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(chickenBonus));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getBonusKills()).isEqualTo(3);
    }

    @Test
    @DisplayName("TOP10 진입 실패 시 SURVIVAL_PENALTY 규칙이 팀 패널티 킬에 적용된다")
    void should_ApplySurvivalPenalty_when_TeamFailsTop10() {
        MatchResult lateResult = MatchResult.builder()
                .match(pendingMatch)
                .teamMember(member)
                .kills(2)
                .placement(11)
                .build();

        Rule penalty = mock(Rule.class);
        given(penalty.getRuleType()).willReturn(RuleType.SURVIVAL_PENALTY);
        given(penalty.getValue()).willReturn(2);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(lateResult));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(penalty));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getPenaltyKills()).isEqualTo(2);
    }

    @Test
    @DisplayName("순위 조건을 만족하면 PLACEMENT_BONUS 규칙이 팀 보너스 킬에 적용된다")
    void should_ApplyPlacementBonus_when_PlacementMeetsCondition() {
        MatchResult top3Result = MatchResult.builder()
                .match(pendingMatch)
                .teamMember(member)
                .kills(4)
                .placement(2)
                .build();

        Rule placementBonus = mock(Rule.class);
        given(placementBonus.getRuleType()).willReturn(RuleType.PLACEMENT_BONUS);
        given(placementBonus.getOperator()).willReturn(Operator.LTE);
        given(placementBonus.getValue()).willReturn(3);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(top3Result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(placementBonus));

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(team.getBonusKills()).isEqualTo(3);
    }

    @Test
    @DisplayName("확정 성공 시 매치 상태가 CONFIRMED로 변경된다")
    void should_MarkMatchAsConfirmed_when_ConfirmSucceeds() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(matchResultRepository.findByMatch(pendingMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID);

        assertThat(pendingMatch.isConfirmed()).isTrue();
    }
}