package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.MatchDto;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchReflectService 매치 결과 반영 테스트")
class MatchReflectServiceTest {

    @Mock private MatchRepository matchRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @InjectMocks private MatchReflectService matchReflectService;

    private static final Long MATCH_ID = 1L;
    private static final Long SESSION_ID = 1L;
    private static final Long USER_ID = 1L;

    private Match confirmedMatch;
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

        confirmedMatch = Match.builder().session(session).matchNumber(1).build();
        ReflectionTestUtils.setField(confirmedMatch, "id", MATCH_ID);
        confirmedMatch.confirm();

        result = MatchResult.builder()
                .match(confirmedMatch)
                .teamMember(member)
                .kills(5)
                .placement(3)
                .build();
    }

    @Test
    @DisplayName("매치가 존재하지 않으면 NotFound 예외가 발생한다")
    void should_ThrowNotFound_when_MatchNotExists() {
        // given
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> matchReflectService.reflect(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("매치를 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("PENDING 상태인 매치는 반영할 수 없다")
    void should_ThrowBadRequest_when_MatchIsNotConfirmed() {
        // given
        Match pendingMatch = Match.builder()
                .session(confirmedMatch.getSession()).matchNumber(2)
                .build(); // 기본값 PENDING
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));

        // when & then
        assertThatThrownBy(() -> matchReflectService.reflect(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("확정되지 않은 매치는 반영할 수 없습니다.");
    }

    @Test
    @DisplayName("이미 반영된 매치는 다시 반영할 수 없다")
    void should_ThrowBadRequest_when_MatchAlreadyReflected() {
        // given
        confirmedMatch.reflect();
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));

        // when & then
        assertThatThrownBy(() -> matchReflectService.reflect(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 반영된 매치입니다.");
    }

    @Test
    @DisplayName("매치 결과 데이터가 없으면 반영할 수 없다")
    void should_ThrowBadRequest_when_MatchHasNoResults() {
        // given
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of());

        // when & then
        assertThatThrownBy(() -> matchReflectService.reflect(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("반영할 매치 결과가 없습니다.");
    }

    @Test
    @DisplayName("업로더 권한이 없는 사용자는 반영할 수 없다")
    void should_ThrowForbidden_when_RequesterIsNotUploader() {
        // given
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(false);

        // when & then
        assertThatThrownBy(() -> matchReflectService.reflect(MATCH_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("업로더 권한이 있는 사용자만 반영할 수 있습니다.");
    }

    @Test
    @DisplayName("반영 성공 시 팀의 총 킬 수가 누적된다")
    void should_AddKillsToTeam_when_MatchIsReflected() {
        // given
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findBySessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        // when
        matchReflectService.reflect(MATCH_ID, USER_ID);

        // then
        assertThat(team.getTotalKills()).isEqualTo(5);
    }

    @Test
    @DisplayName("반영 성공 시 팀 멤버의 총 킬 수가 업데이트된다")
    void should_UpdateTeamMemberKills_when_MatchIsReflected() {
        // given
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findBySessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        // when
        matchReflectService.reflect(MATCH_ID, USER_ID);

        // then
        assertThat(member.getTotalKills()).isEqualTo(5);
    }

    @Test
    @DisplayName("치킨 달성 시 CHICKEN_BONUS 규칙이 팀 보너스 킬에 적용된다")
    void should_ApplyChickenBonus_when_TeamGetsChicken() {
        // given
        MatchResult chickenResult = MatchResult.builder()
                .match(confirmedMatch)
                .teamMember(member)
                .kills(3)
                .placement(1) // 치킨
                .build();

        Rule chickenBonus = Rule.builder()
                .session(confirmedMatch.getSession())
                .ruleType(Rule.RuleType.CHICKEN_BONUS)
                .killValue(3)
                .build();

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of(chickenResult));
        given(teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findBySessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(chickenBonus));

        // when
        matchReflectService.reflect(MATCH_ID, USER_ID);

        // then
        assertThat(team.getBonusKills()).isEqualTo(3);
    }

    @Test
    @DisplayName("TOP10 진입 실패 시 SURVIVAL_PENALTY 규칙이 팀 패널티 킬에 적용된다")
    void should_ApplySurvivalPenalty_when_TeamFailsTop10() {
        // given
        MatchResult lateResult = MatchResult.builder()
                .match(confirmedMatch)
                .teamMember(member)
                .kills(2)
                .placement(11) // TOP10 실패
                .build();

        Rule penalty = Rule.builder()
                .session(confirmedMatch.getSession())
                .ruleType(Rule.RuleType.SURVIVAL_PENALTY)
                .killValue(2)
                .build();

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of(lateResult));
        given(teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findBySessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(penalty));

        // when
        matchReflectService.reflect(MATCH_ID, USER_ID);

        // then
        assertThat(team.getPenaltyKills()).isEqualTo(2);
    }

    @Test
    @DisplayName("반영 성공 시 매치 상태가 REFLECTED로 변경된다")
    void should_MarkMatchAsReflected_when_ReflectSucceeds() {
        // given
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(confirmedMatch));
        given(matchResultRepository.findByMatch(confirmedMatch)).willReturn(List.of(result));
        given(teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(SESSION_ID, USER_ID))
                .willReturn(true);
        given(ruleRepository.findBySessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        // when
        matchReflectService.reflect(MATCH_ID, USER_ID);

        // then
        assertThat(confirmedMatch.isReflected()).isTrue();
    }
}
