package com.killnagi.domain.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.admin.dto.response.AdminSessionDetailResponse;
import com.killnagi.domain.admin.dto.response.AdminSessionSummaryResponse;
import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.dto.response.SessionParticipantCount;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.session.service.SessionMatchService;
import com.killnagi.domain.team.service.TeamService;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminSessionService 어드민 세션 드릴다운 테스트")
class AdminSessionServiceTest {

    @Mock SessionRepository sessionRepository;
    @Mock SessionUserRepository sessionUserRepository;
    @Mock SessionMatchService sessionMatchService;
    @Mock TeamService teamService;

    @InjectMocks AdminSessionService adminSessionService;

    @Test
    @DisplayName("상태 필터가 없으면 전체 세션을 페이징으로 반환하고 참가자 수를 매핑한다")
    void 상태_필터가_없으면_전체_세션을_반환하고_참가자_수를_매핑한다() {
        // given
        User host = TestFixtures.user(1L, "호스트", "host@test.com");
        Session session = TestFixtures.session(10L, host);
        Pageable pageable = PageRequest.of(0, 20);
        given(sessionRepository.findAllWithHost(pageable))
                .willReturn(new PageImpl<>(List.of(session), pageable, 1));
        given(sessionUserRepository.countActiveParticipantsBySessionIds(List.of(10L)))
                .willReturn(List.of(new SessionParticipantCount(10L, 4L)));

        // when
        Page<AdminSessionSummaryResponse> result = adminSessionService.getSessions(null, pageable);

        // then
        assertThat(result.getContent()).hasSize(1);
        AdminSessionSummaryResponse summary = result.getContent().get(0);
        assertThat(summary.id()).isEqualTo(10L);
        assertThat(summary.hostNickname()).isEqualTo("호스트");
        assertThat(summary.participantCount()).isEqualTo(4L);
    }

    @Test
    @DisplayName("상태 필터가 있으면 해당 상태의 세션만 조회한다")
    void 상태_필터가_있으면_해당_상태의_세션만_조회한다() {
        // given
        User host = TestFixtures.user(1L, "호스트", "host@test.com");
        Session session = TestFixtures.session(10L, host);
        Pageable pageable = PageRequest.of(0, 20);
        given(sessionRepository.findByStatusWithHost(SessionStatus.IN_PROGRESS, pageable))
                .willReturn(new PageImpl<>(List.of(session), pageable, 1));
        given(sessionUserRepository.countActiveParticipantsBySessionIds(List.of(10L)))
                .willReturn(List.of());

        // when
        Page<AdminSessionSummaryResponse> result =
                adminSessionService.getSessions(SessionStatus.IN_PROGRESS, pageable);

        // then
        assertThat(result.getContent()).hasSize(1);
        // 참가자 집계가 없으면 0으로 방어
        assertThat(result.getContent().get(0).participantCount()).isZero();
    }

    @Test
    @DisplayName("존재하는 세션의 상세를 메타·팀·매치결과·스코어보드로 조합해 반환한다")
    void 존재하는_세션의_상세를_조합해_반환한다() {
        // given
        User host = TestFixtures.user(1L, "호스트", "host@test.com");
        Session session = TestFixtures.session(10L, host);
        MatchHistoryResponse matchHistory = new MatchHistoryResponse(10L, "세션", 0, List.of());
        ScoreboardResponse scoreboard =
                new ScoreboardResponse(10L, "세션", session.getStatus(), null, null, false, List.of());
        given(sessionRepository.findById(10L)).willReturn(Optional.of(session));
        given(teamService.getTeams(10L)).willReturn(List.of());
        given(sessionMatchService.getMatchHistory(10L)).willReturn(matchHistory);
        given(sessionMatchService.getScoreboard(10L)).willReturn(scoreboard);

        // when
        AdminSessionDetailResponse detail = adminSessionService.getSessionDetail(10L);

        // then
        assertThat(detail.meta().id()).isEqualTo(10L);
        assertThat(detail.meta().hostNickname()).isEqualTo("호스트");
        assertThat(detail.teams()).isEmpty();
        assertThat(detail.matchHistory()).isSameAs(matchHistory);
        assertThat(detail.scoreboard()).isSameAs(scoreboard);
    }

    @Test
    @DisplayName("존재하지 않는 세션의 상세를 요청하면 예외를 던진다")
    void 존재하지_않는_세션의_상세를_요청하면_예외를_던진다() {
        given(sessionRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminSessionService.getSessionDetail(99L))
                .isInstanceOf(KillnagiException.class);
    }
}