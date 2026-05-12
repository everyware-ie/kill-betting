package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.repository.SessionRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionQueryService 세션 조회 테스트")
class SessionQueryServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private RuleRepository ruleRepository;
    @InjectMocks private SessionQueryService sessionQueryService;

    @Test
    void 존재하지_않는_세션_조회시_예외를_던진다() {
        given(sessionRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sessionQueryService.getSessionById(999L))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("세션을 찾을 수 없습니다");
    }
}