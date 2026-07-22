package com.killnagi.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;

import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminAccessManager 어드민 접근 제어 테스트")
class AdminAccessManagerTest {

    private static final String ADMIN_EMAIL = "admin@kill.gg";

    @Mock
    UserRepository userRepository;

    AdminAccessManager adminAccessManager;

    @BeforeEach
    void setUp() {
        adminAccessManager = new AdminAccessManager(userRepository, ADMIN_EMAIL);
    }

    @Test
    @DisplayName("어드민 이메일이 아닌 유저는 접근이 거부된다")
    void 어드민_이메일이_아닌_유저는_접근이_거부된다() {
        // given
        given(userRepository.findById(1L))
                .willReturn(Optional.of(TestFixtures.user(1L, "일반유저", "user@example.com")));
        Authentication authentication =
                new UsernamePasswordAuthenticationToken("1", null, List.of());

        // when
        AuthorizationDecision result = adminAccessManager.check(() -> authentication, null);

        // then
        assertThat(result.isGranted()).isFalse();
    }

    @Test
    @DisplayName("어드민 이메일과 일치하는 유저는 접근이 허용된다")
    void 어드민_이메일과_일치하는_유저는_접근이_허용된다() {
        // given
        given(userRepository.findById(1L))
                .willReturn(Optional.of(TestFixtures.user(1L, "어드민", ADMIN_EMAIL)));
        Authentication authentication =
                new UsernamePasswordAuthenticationToken("1", null, List.of());

        // when
        AuthorizationDecision result = adminAccessManager.check(() -> authentication, null);

        // then
        assertThat(result.isGranted()).isTrue();
    }
}