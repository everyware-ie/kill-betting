package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.dto.response.MySessionResponse;
import com.killnagi.domain.session.dto.response.MySessionResponse.SessionRole;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("세션 조회 서비스")
class SessionQueryServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private TeamRepository teamRepository;

    @InjectMocks private SessionQueryService sessionQueryService;

    @Test
    @DisplayName("SessionUser 기록 없이 팀 리더로만 지정된 세션도 내 세션 목록에 포함되고 역할은 LEADER이다")
    void 리더로만_지정된_세션도_내_세션_목록에_포함된다() {
        // given
        Long userId = 1L;
        Session leaderOnlySession = TestFixtures.session(10L, TestFixtures.user(99L));

        given(sessionRepository.findSessionsByUserId(userId)).willReturn(List.of());
        given(teamRepository.findSessionIdsByLeaderUserId(userId)).willReturn(Set.of(10L));
        given(sessionRepository.findAllById(List.of(10L))).willReturn(List.of(leaderOnlySession));

        // when
        List<MySessionResponse> result = sessionQueryService.getMySessions(userId);

        // then
        assertThat(result).extracting(MySessionResponse::id).containsExactly(10L);
        assertThat(result).extracting(MySessionResponse::myRole).containsExactly(SessionRole.LEADER);
    }

    @Test
    @DisplayName("이미 조회된 세션의 리더인 경우 중복으로 포함되지 않는다")
    void 이미_조회된_세션이면_중복으로_포함되지_않는다() {
        // given
        Long userId = 1L;
        Session ownSession = TestFixtures.session(20L, TestFixtures.user(userId));

        given(sessionRepository.findSessionsByUserId(userId)).willReturn(List.of(ownSession));
        given(teamRepository.findSessionIdsByLeaderUserId(userId)).willReturn(Set.of(20L));

        // when
        List<MySessionResponse> result = sessionQueryService.getMySessions(userId);

        // then
        assertThat(result).extracting(MySessionResponse::id).containsExactly(20L);
    }
}