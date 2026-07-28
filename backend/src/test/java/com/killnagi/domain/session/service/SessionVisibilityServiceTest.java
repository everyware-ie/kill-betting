package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.HiddenSession;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.HiddenSessionRepository;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("세션 목록 노출 처리 서비스")
class SessionVisibilityServiceTest {

    @Mock private HiddenSessionRepository hiddenSessionRepository;
    @Mock private SessionRepository sessionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private SessionVisibilityService sessionVisibilityService;

    private static final Long SESSION_ID = 10L;
    private static final Long USER_ID = 1L;

    @Test
    @DisplayName("숨기지 않은 세션을 숨기면 숨김 레코드가 저장된다")
    void 숨기지_않은_세션을_숨기면_숨김_레코드가_저장된다() {
        User user = TestFixtures.user(USER_ID);
        Session session = TestFixtures.session(SESSION_ID, user);

        given(hiddenSessionRepository.existsBySession_IdAndUser_Id(SESSION_ID, USER_ID)).willReturn(false);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(userRepository.getReferenceById(USER_ID)).willReturn(user);

        sessionVisibilityService.hide(SESSION_ID, USER_ID);

        then(hiddenSessionRepository).should().save(any(HiddenSession.class));
    }

    @Test
    @DisplayName("이미 숨긴 세션을 다시 숨기면 중복 저장하지 않는다")
    void 이미_숨긴_세션을_다시_숨기면_중복_저장하지_않는다() {
        given(hiddenSessionRepository.existsBySession_IdAndUser_Id(SESSION_ID, USER_ID)).willReturn(true);

        sessionVisibilityService.hide(SESSION_ID, USER_ID);

        then(hiddenSessionRepository).should(never()).save(any(HiddenSession.class));
    }

    @Test
    @DisplayName("숨김을 해제하면 숨김 레코드가 삭제된다")
    void 숨김을_해제하면_숨김_레코드가_삭제된다() {
        sessionVisibilityService.restore(SESSION_ID, USER_ID);

        then(hiddenSessionRepository).should().deleteBySessionIdAndUserId(SESSION_ID, USER_ID);
    }

    @Test
    @DisplayName("존재하지 않는 세션을 숨기려 하면 예외가 발생한다")
    void 존재하지_않는_세션을_숨기려_하면_예외가_발생한다() {
        given(hiddenSessionRepository.existsBySession_IdAndUser_Id(SESSION_ID, USER_ID)).willReturn(false);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sessionVisibilityService.hide(SESSION_ID, USER_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션을 찾을 수 없습니다.");
    }
}