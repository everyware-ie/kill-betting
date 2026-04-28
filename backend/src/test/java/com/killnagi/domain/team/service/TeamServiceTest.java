package com.killnagi.domain.team.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamService 팀 관리 테스트")
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private SessionRepository sessionRepository;
    @InjectMocks private TeamService teamService;

    private static final Long HOST_ID = 1L;
    private static final Long SESSION_ID = 10L;

    @Test
    void 호스트가_팀을_생성하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team team = TestFixtures.team(session);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.save(any(Team.class))).willReturn(team);

        TeamResponse response = teamService.createTeam(SESSION_ID, HOST_ID, new CreateTeamRequest("팀A"));

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
}
