package com.killnagi.domain.team.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.dto.request.AddMemberRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.team.repository.TeamMemberRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamService 팀 관리 테스트")
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private SessionRepository sessionRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private TeamService teamService;

    private static final Long HOST_ID = 1L;
    private static final Long SESSION_ID = 10L;
    private static final Long TEAM_ID = 100L;

    @Test
    void 호스트가_팀을_생성하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = TestFixtures.team(session);
        CreateTeamRequest request = new CreateTeamRequest("팀A");

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.save(any(Team.class))).willReturn(team);

        TeamResponse response = teamService.createTeam(SESSION_ID, HOST_ID, request);

        assertThat(response.name()).isEqualTo("팀A");
    }

    @Test
    void 호스트가_아니면_팀_생성시_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> teamService.createTeam(SESSION_ID, otherUserId, new CreateTeamRequest("팀A")))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 팀을 생성할 수 있습니다.");
    }

    @Test
    void 대기_상태가_아닌_세션에서_팀_생성시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        session.start();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> teamService.createTeam(SESSION_ID, HOST_ID, new CreateTeamRequest("팀A")))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("대기 중인 세션에서만 팀을 생성할 수 있습니다.");
    }

    @Test
    void 멤버_추가_성공시_팀_응답을_반환한다() {
        User host = TestFixtures.user(HOST_ID);
        User newUser = TestFixtures.user(2L, "newuser", "new@test.com");
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = TestFixtures.team(session);
        AddMemberRequest request = new AddMemberRequest(newUser.getId());

        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_Id(SESSION_ID, newUser.getId())).willReturn(false);
        given(userRepository.findById(newUser.getId())).willReturn(Optional.of(newUser));
        given(teamMemberRepository.save(any(TeamMember.class))).willReturn(TestFixtures.member(team, newUser));

        TeamResponse response = teamService.addMember(SESSION_ID, TEAM_ID, request);

        assertThat(response).isNotNull();
    }

    @Test
    void 팀_인원이_4명_초과시_멤버_추가에_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = TestFixtures.team(session);

        List<TeamMember> fullMembers = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            fullMembers.add(TestFixtures.member(team, TestFixtures.user((long) (i + 10), "user" + i, "user" + i + "@test.com")));
        }
        ReflectionTestUtils.setField(team, "members", fullMembers);

        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        assertThatThrownBy(() -> teamService.addMember(SESSION_ID, TEAM_ID, new AddMemberRequest(99L)))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("팀은 최대 4명까지 구성할 수 있습니다.");
    }

    @Test
    void 이미_세션에_참여중인_유저_추가시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = TestFixtures.team(session);
        AddMemberRequest request = new AddMemberRequest(HOST_ID);

        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));
        given(teamMemberRepository.existsByTeam_Session_IdAndUser_Id(SESSION_ID, HOST_ID)).willReturn(true);

        assertThatThrownBy(() -> teamService.addMember(SESSION_ID, TEAM_ID, request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 세션에 참여 중인 사용자입니다.");
    }
}