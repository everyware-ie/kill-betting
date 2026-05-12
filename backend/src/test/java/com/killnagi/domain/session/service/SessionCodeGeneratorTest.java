package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.repository.SessionRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionCodeGenerator 방 코드 생성 테스트")
class SessionCodeGeneratorTest {

    @Mock private SessionRepository sessionRepository;
    @InjectMocks private SessionCodeGenerator sessionCodeGenerator;

    @Test
    void 생성된_코드는_6자리_영문대문자_숫자로_구성된다() {
        given(sessionRepository.existsByRoomCode(anyString())).willReturn(false);

        String code = sessionCodeGenerator.generate();

        assertThat(code).hasSize(6);
        assertThat(code).matches("[A-Z0-9]{6}");
    }

    @Test
    void 중복된_코드가_있으면_새로운_코드를_생성한다() {
        given(sessionRepository.existsByRoomCode(anyString()))
                .willReturn(true)
                .willReturn(true)
                .willReturn(false);

        String code = sessionCodeGenerator.generate();

        assertThat(code).matches("[A-Z0-9]{6}");
    }

    @Test
    void 최대_시도_횟수를_초과하면_예외가_발생한다() {
        given(sessionRepository.existsByRoomCode(anyString())).willReturn(true);

        assertThatThrownBy(() -> sessionCodeGenerator.generate())
                .isInstanceOf(KillnagiException.class)
                .hasMessage("방 코드 생성에 실패했습니다.");
    }
}