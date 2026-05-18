package com.killnagi.domain.team.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.event.AdjustmentAppliedEvent;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamAdjustmentService 점수 조정 테스트")
class TeamAdjustmentServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private TeamAdjustmentService teamAdjustmentService;

    private static final Long HOST_ID   = 1L;
    private static final Long SESSION_ID = 10L;
    private static final Long TEAM_ID   = 20L;

    @Test
    void 호스트가_진행_중인_세션에서_조정을_적용하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = liveSession(host);
        Team team = TestFixtures.team(session);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, 3, "서버 오류 보상");

        assertThat(team.getAdjustmentScore()).isEqualTo(3);
    }

    @Test
    void 조정_적용_후_이벤트가_발행된다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = liveSession(host);
        Team team = TestFixtures.team(session);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, 3, "서버 오류 보상");

        ArgumentCaptor<AdjustmentAppliedEvent> captor = ArgumentCaptor.forClass(AdjustmentAppliedEvent.class);
        then(eventPublisher).should().publishEvent(captor.capture());
        assertThat(captor.getValue().sessionId()).isEqualTo(SESSION_ID);
        assertThat(captor.getValue().teamId()).isEqualTo(TEAM_ID);
        assertThat(captor.getValue().amount()).isEqualTo(3);
    }

    @Test
    void 음수_조정도_적용된다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = liveSession(host);
        Team team = TestFixtures.team(session);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.of(team));

        teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, -2, "패널티");

        assertThat(team.getAdjustmentScore()).isEqualTo(-2);
    }

    @Test
    void 호스트가_아니면_조정시_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session session = liveSession(host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() ->
                teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, otherUserId, 3, "사유"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 점수를 조정할 수 있습니다.");
    }

    @Test
    void 대기_상태_세션에서_조정시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host); // WAITING 상태

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() ->
                teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, 3, "사유"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("진행 중인 세션에서만 점수를 조정할 수 있습니다.");
    }

    @Test
    void 종료된_세션에서_조정시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        session.start();
        session.end(null);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() ->
                teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, 3, "사유"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("진행 중인 세션에서만 점수를 조정할 수 있습니다.");
    }

    @Test
    void 세션을_찾을_수_없으면_예외가_발생한다() {
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() ->
                teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, 3, "사유"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션을 찾을 수 없습니다.");
    }

    @Test
    void 팀을_찾을_수_없으면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = liveSession(host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findByIdAndSessionId(TEAM_ID, SESSION_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() ->
                teamAdjustmentService.applyAdjustment(SESSION_ID, TEAM_ID, HOST_ID, 3, "사유"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("팀을 찾을 수 없습니다.");
    }

    private Session liveSession(User host) {
        Session session = TestFixtures.session(SESSION_ID, host);
        session.start();
        return session;
    }
}
