package com.killnagi.domain.team.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.service.SessionParticipantRegistry;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamConfigureService 팀 구성 테스트")
class TeamConfigureServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamPlayerRepository teamPlayerRepository;
    @Mock private UserRepository userRepository;
    @Mock private SessionParticipantRegistry registry;
    @InjectMocks private TeamConfigureService teamConfigureService;

    private static final Long HOST_ID = 1L;
    private static final Long SESSION_ID = 10L;
    private static final Long TEAM_ID = 20L;
    private static final Long PLAYER_ID = 30L;
    private static final Long LEADER_ID = 40L;
    private static final Long OTHER_LEADER_ID = 41L;
    private static final Long STRANGER_ID = 42L;

    // ── addPlayer ─────────────────────────────────────────────────────────────

    @Test
    void 호스트가_팀에_플레이어를_추가하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.countByTeam_Id(TEAM_ID)).willReturn(0);
        given(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(TEAM_ID, "Player1")).willReturn(false);
        given(teamPlayerRepository.save(any(TeamPlayer.class))).willAnswer(inv -> inv.getArgument(0));

        teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, HOST_ID, "Player1");

        then(teamPlayerRepository).should().save(any(TeamPlayer.class));
    }

    @Test
    void 팀_정원이_초과되면_플레이어_추가시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.countByTeam_Id(TEAM_ID)).willReturn(4);

        assertThatThrownBy(() -> teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, HOST_ID, "Player1"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("최대");
    }

    @Test
    void 이미_등록된_닉네임으로_추가하면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.countByTeam_Id(TEAM_ID)).willReturn(1);
        given(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(TEAM_ID, "Dup")).willReturn(true);

        assertThatThrownBy(() -> teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, HOST_ID, "Dup"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("이미 등록된");
    }

    @Test
    void 호스트가_아니면_플레이어_추가시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        // 리더가 없는 팀 — 호스트도 리더도 아닌 사용자는 팀원을 관리할 수 없다
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        assertThatThrownBy(() -> teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, 99L, "Player1"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("호스트");
    }

    // ── updatePlayer ──────────────────────────────────────────────────────────

    @Test
    void 호스트가_플레이어_닉네임을_수정하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);
        TeamPlayer player = playerWithId(team, PLAYER_ID, "OldName");

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.findById(PLAYER_ID)).willReturn(Optional.of(player));
        given(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(TEAM_ID, "NewName")).willReturn(false);

        teamConfigureService.updatePlayer(SESSION_ID, TEAM_ID, PLAYER_ID, HOST_ID, "NewName");

        assertThat(player.getPlayerNickname()).isEqualTo("NewName");
    }

    @Test
    void 존재하지_않는_플레이어_수정시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.findById(PLAYER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> teamConfigureService.updatePlayer(SESSION_ID, TEAM_ID, PLAYER_ID, HOST_ID, "NewName"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("팀원을 찾을 수 없습니다");
    }

    // ── removePlayer ──────────────────────────────────────────────────────────

    @Test
    void 호스트가_팀에서_플레이어를_제거하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);
        TeamPlayer player = playerWithId(team, PLAYER_ID, "Player1");

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.findById(PLAYER_ID)).willReturn(Optional.of(player));

        teamConfigureService.removePlayer(SESSION_ID, TEAM_ID, PLAYER_ID, HOST_ID);

        then(teamPlayerRepository).should().delete(player);
    }

    @Test
    void 존재하지_않는_플레이어_제거시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.findById(PLAYER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> teamConfigureService.removePlayer(SESSION_ID, TEAM_ID, PLAYER_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("팀원을 찾을 수 없습니다");
    }

    // ── assignLeader ──────────────────────────────────────────────────────────

    @Test
    void 호스트가_대기석_참가자를_리더로_배정하면_성공한다() {
        Long targetUserId = 50L;
        User host = TestFixtures.user(HOST_ID);
        User target = TestFixtures.user(targetUserId, "player", "player@test.com");
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(registry.isParticipant(SESSION_ID, targetUserId)).willReturn(true);
        given(teamRepository.existsBySessionIdAndLeader_IdAndIdNot(SESSION_ID, targetUserId, TEAM_ID)).willReturn(false);
        given(userRepository.findById(targetUserId)).willReturn(Optional.of(target));

        teamConfigureService.assignLeader(SESSION_ID, TEAM_ID, HOST_ID, targetUserId);

        assertThat(team.hasLeader()).isTrue();
        assertThat(team.getLeaderUserId()).isEqualTo(targetUserId);
    }

    @Test
    void 대기석에_없는_사용자를_리더로_배정하면_예외가_발생한다() {
        Long targetUserId = 50L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(registry.isParticipant(SESSION_ID, targetUserId)).willReturn(false);

        assertThatThrownBy(() -> teamConfigureService.assignLeader(SESSION_ID, TEAM_ID, HOST_ID, targetUserId))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("대기석");
    }

    @Test
    void 다른_팀의_리더를_배정하면_예외가_발생한다() {
        Long targetUserId = 50L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(registry.isParticipant(SESSION_ID, targetUserId)).willReturn(true);
        given(teamRepository.existsBySessionIdAndLeader_IdAndIdNot(SESSION_ID, targetUserId, TEAM_ID)).willReturn(true);

        assertThatThrownBy(() -> teamConfigureService.assignLeader(SESSION_ID, TEAM_ID, HOST_ID, targetUserId))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("이미 다른 팀의");
    }

    // ── unassignLeader ────────────────────────────────────────────────────────

    @Test
    void 호스트가_팀_리더를_해제하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        User leader = TestFixtures.user(50L, "leader", "leader@test.com");
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);
        team.assignLeader(leader);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        teamConfigureService.unassignLeader(SESSION_ID, TEAM_ID, HOST_ID);

        assertThat(team.hasLeader()).isFalse();
    }

    @Test
    void 리더가_없는_팀에서_해제하면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        assertThatThrownBy(() -> teamConfigureService.unassignLeader(SESSION_ID, TEAM_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("배정된 Leader가 없습니다");
    }

    @Test
    void 호스트가_아니면_리더_해제시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> teamConfigureService.unassignLeader(SESSION_ID, TEAM_ID, 99L))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("호스트");
    }

    // ── buildConfigureState ───────────────────────────────────────────────────

    @Test
    void buildConfigureState_리더_없는_팀은_EMPTY를_반환한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(registry.getParticipantIds(SESSION_ID)).willReturn(Set.of());
        given(userRepository.findAllById(any())).willReturn(List.of());
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(team));

        ConfigureStateMessage state = teamConfigureService.buildConfigureState(SESSION_ID);

        assertThat(state.teams().get(0).status()).isEqualTo("EMPTY");
    }

    @Test
    void buildConfigureState_리더만_있는_팀은_PARTIAL을_반환한다() {
        User host = TestFixtures.user(HOST_ID);
        User leader = TestFixtures.user(50L, "leader", "leader@test.com");
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);
        team.assignLeader(leader);

        given(registry.getParticipantIds(SESSION_ID)).willReturn(Set.of(50L));
        given(userRepository.findAllById(any())).willReturn(List.of(leader));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(team));

        ConfigureStateMessage state = teamConfigureService.buildConfigureState(SESSION_ID);

        assertThat(state.teams().get(0).status()).isEqualTo("PARTIAL");
    }

    @Test
    void buildConfigureState_리더와_플레이어가_있는_팀은_READY를_반환한다() {
        User host = TestFixtures.user(HOST_ID);
        User leader = TestFixtures.user(50L, "leader", "leader@test.com");
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);
        team.assignLeader(leader);
        TeamPlayer player = TestFixtures.player(team, "PlayerOne");
        ReflectionTestUtils.setField(player, "id", 100L);
        team.getPlayers().add(player);

        given(registry.getParticipantIds(SESSION_ID)).willReturn(Set.of(50L));
        given(userRepository.findAllById(any())).willReturn(List.of(leader));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(team));

        ConfigureStateMessage state = teamConfigureService.buildConfigureState(SESSION_ID);

        assertThat(state.teams().get(0).status()).isEqualTo("READY");
    }

    @Test
    void buildConfigureState_리더가_배정되지_않은_참가자는_대기석에_포함된다() {
        User host = TestFixtures.user(HOST_ID);
        User waiting = TestFixtures.user(60L, "waiting", "waiting@test.com");
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = teamWithId(session, TEAM_ID);

        given(registry.getParticipantIds(SESSION_ID)).willReturn(Set.of(60L));
        given(userRepository.findAllById(any())).willReturn(List.of(waiting));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(team));

        ConfigureStateMessage state = teamConfigureService.buildConfigureState(SESSION_ID);

        assertThat(state.waitingUsers()).hasSize(1);
        assertThat(state.waitingUsers().get(0).userId()).isEqualTo(60L);
    }

    // ── 팀 구성 권한 위임 (FRD T1~T3) ─────────────────────────────────────────

    @Test
    @DisplayName("팀 리더는 본인 팀에 플레이어를 추가할 수 있다")
    void 팀_리더가_본인_팀에_플레이어를_추가하면_성공한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        Team team = teamWithLeader(session, TEAM_ID, LEADER_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.countByTeam_Id(TEAM_ID)).willReturn(0);
        given(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(TEAM_ID, "Player1")).willReturn(false);
        given(teamPlayerRepository.save(any(TeamPlayer.class))).willAnswer(inv -> inv.getArgument(0));

        teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, LEADER_ID, "Player1");

        then(teamPlayerRepository).should().save(any(TeamPlayer.class));
    }

    @Test
    @DisplayName("본인이 리더가 아닌 팀에는 플레이어를 추가할 수 없다")
    void 다른_팀의_리더가_플레이어를_추가하면_예외가_발생한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        Team team = teamWithLeader(session, TEAM_ID, LEADER_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        assertThatThrownBy(() -> teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, OTHER_LEADER_ID, "Player1"))
                .isInstanceOf(KillnagiException.class);
    }

    @Test
    @DisplayName("호스트도 리더도 아닌 참여자는 팀을 구성할 수 없다")
    void 권한없는_참여자가_플레이어를_추가하면_예외가_발생한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        Team team = teamWithLeader(session, TEAM_ID, LEADER_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        assertThatThrownBy(() -> teamConfigureService.addPlayer(SESSION_ID, TEAM_ID, STRANGER_ID, "Player1"))
                .isInstanceOf(KillnagiException.class);
    }

    @Test
    @DisplayName("팀 리더는 본인 팀 플레이어의 닉네임을 수정할 수 있다")
    void 팀_리더가_본인_팀_플레이어를_수정하면_성공한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        Team team = teamWithLeader(session, TEAM_ID, LEADER_ID);
        TeamPlayer player = playerWithId(team, PLAYER_ID, "Before");

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.findById(PLAYER_ID)).willReturn(Optional.of(player));
        given(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(TEAM_ID, "After")).willReturn(false);

        teamConfigureService.updatePlayer(SESSION_ID, TEAM_ID, PLAYER_ID, LEADER_ID, "After");

        assertThat(player.getPlayerNickname()).isEqualTo("After");
    }

    @Test
    @DisplayName("팀 리더는 본인 팀 플레이어를 삭제할 수 있다")
    void 팀_리더가_본인_팀_플레이어를_삭제하면_성공한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        Team team = teamWithLeader(session, TEAM_ID, LEADER_ID);
        TeamPlayer player = playerWithId(team, PLAYER_ID, "Player1");

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamPlayerRepository.findById(PLAYER_ID)).willReturn(Optional.of(player));

        teamConfigureService.removePlayer(SESSION_ID, TEAM_ID, PLAYER_ID, LEADER_ID);

        then(teamPlayerRepository).should().delete(player);
    }

    @Test
    @DisplayName("팀 리더는 리더 지정을 할 수 없다 — 팀 구조 변경은 Host 전용(T3)")
    void 팀_리더가_리더를_지정하면_예외가_발생한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        Team team = teamWithLeader(session, TEAM_ID, LEADER_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> teamConfigureService.assignLeader(SESSION_ID, TEAM_ID, LEADER_ID, STRANGER_ID))
                .isInstanceOf(KillnagiException.class);
    }

    @Test
    @DisplayName("팀 리더는 리더 해제를 할 수 없다 — 팀 구조 변경은 Host 전용(T3)")
    void 팀_리더가_리더를_해제하면_예외가_발생한다() {
        Session session = TestFixtures.session(SESSION_ID, TestFixtures.user(HOST_ID));
        teamWithLeader(session, TEAM_ID, LEADER_ID);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> teamConfigureService.unassignLeader(SESSION_ID, TEAM_ID, LEADER_ID))
                .isInstanceOf(KillnagiException.class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Team teamWithLeader(Session session, Long teamId, Long leaderId) {
        Team team = teamWithId(session, teamId);
        team.assignLeader(TestFixtures.user(leaderId));
        return team;
    }

    private Team teamWithId(Session session, Long id) {
        Team team = TestFixtures.team(session);
        ReflectionTestUtils.setField(team, "id", id);
        return team;
    }

    private TeamPlayer playerWithId(Team team, Long id, String nickname) {
        TeamPlayer player = TestFixtures.player(team, nickname);
        ReflectionTestUtils.setField(player, "id", id);
        return player;
    }
}