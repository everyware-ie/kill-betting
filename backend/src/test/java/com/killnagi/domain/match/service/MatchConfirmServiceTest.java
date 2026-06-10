package com.killnagi.domain.match.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.Optional;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.request.ConfirmRequest;
import com.killnagi.domain.match.dto.request.ConfirmRequest.PlayerResult;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchStatus;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleType;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchConfirmService 매치 결과 확정 테스트")
class MatchConfirmServiceTest {

    @Mock private MatchRepository matchRepository;
    @Mock private MatchResultRepository matchResultRepository;
    @Mock private TeamPlayerRepository teamPlayerRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Spy MeterRegistry meterRegistry = new SimpleMeterRegistry();
    @InjectMocks private MatchConfirmService matchConfirmService;

    private static final Long MATCH_ID = 1L;
    private static final Long SESSION_ID = 1L;
    private static final Long USER_ID = 1L;
    private static final Long TEAM_ID = 1L;

    private Match pendingMatch;
    private Team team;
    private TeamPlayer player;

    @BeforeEach
    void setUp() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        team = TestFixtures.team(session);
        ReflectionTestUtils.setField(team, "id", TEAM_ID);
        player = TestFixtures.player(team, "PlayerOne");
        pendingMatch = TestFixtures.match(MATCH_ID, session);
        ReflectionTestUtils.setField(pendingMatch, "team", team);
    }

    @Test
    void 매치가_존재하지_않으면_NotFound_예외가_발생한다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 3, 5, true)))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("매치를 찾을 수 없습니다.");
    }

    @Test
    void 이미_확정된_매치는_다시_확정할_수_없다() {
        ReflectionTestUtils.setField(pendingMatch, "status", MatchStatus.CONFIRMED);
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 3, 5, true)))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 확정된 매치입니다.");
    }

    @Test
    void 리더가_아닌_사용자는_확정할_수_없다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(false);

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 3, 5, true)))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("업로더 권한이 있는 사용자만 결과를 확정할 수 있습니다.");
    }

    @Test
    void 팀원이_아닌_닉네임으로_확정하면_예외가_발생한다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player));

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("UnknownPlayer", 3, 5, true)))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("팀원이 아닙니다");
    }

    @Test
    void 결과가_누락된_팀원이_있으면_예외가_발생한다() {
        TeamPlayer anotherPlayer = TestFixtures.player(team, "PlayerTwo");
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player, anotherPlayer));

        assertThatThrownBy(() -> matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 3, 5, true)))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("결과가 입력되지 않은 팀원이 있습니다.");
    }

    @Test
    void 확정_성공시_팀의_총_킬수가_누적된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player));
        given(matchResultRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 5, 3, true));

        assertThat(team.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 확정_성공시_팀원의_총_킬수가_업데이트된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player));
        given(matchResultRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 5, 3, true));

        assertThat(player.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 치킨_달성시_CHICKEN_BONUS_규칙이_팀_보너스_킬에_적용된다() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        Rule chickenBonus = TestFixtures.rule(session, RuleType.CHICKEN_BONUS, 3);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player));
        given(matchResultRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(chickenBonus));

        matchConfirmService.confirm(MATCH_ID, USER_ID, chickenConfirmRequest("PlayerOne", 3));

        assertThat(team.getRuleScore()).isEqualTo(3);
    }

    @Test
    void TOP10_진입_실패시_SURVIVAL_PENALTY_규칙이_팀_패널티_킬에_적용된다() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);
        Rule penalty = TestFixtures.rule(session, RuleType.SURVIVAL_PENALTY, 2);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player));
        given(matchResultRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of(penalty));

        matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 2, 15, false));

        assertThat(team.getRuleScore()).isEqualTo(-2);
    }

    @Test
    void 확정_성공시_매치_상태가_CONFIRMED로_변경된다() {
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(pendingMatch));
        given(teamRepository.existsBySessionIdAndLeader_Id(SESSION_ID, USER_ID)).willReturn(true);
        given(teamPlayerRepository.findByTeam_Id(TEAM_ID)).willReturn(List.of(player));
        given(matchResultRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));
        given(ruleRepository.findByRuleSetSessionIdAndEnabled(SESSION_ID, true)).willReturn(List.of());

        matchConfirmService.confirm(MATCH_ID, USER_ID, confirmRequest("PlayerOne", 3, 5, true));

        assertThat(pendingMatch.isConfirmed()).isTrue();
    }

    private ConfirmRequest confirmRequest(String nickname, int kills, int placement, boolean isTop10) {
        return new ConfirmRequest("에란겔", placement, "25:30",
                List.of(new PlayerResult(nickname, kills, 100, 0, isTop10)), false);
    }

    private ConfirmRequest chickenConfirmRequest(String nickname, int kills) {
        return new ConfirmRequest("에란겔", 1, "25:30",
                List.of(new PlayerResult(nickname, kills, 500, 2, true)), true);
    }
}
