package com.killnagi.domain.user.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.common.security.JwtTokenProvider;
import com.killnagi.domain.user.dto.request.LoginRequest;
import com.killnagi.domain.user.dto.request.SignUpRequest;
import com.killnagi.domain.user.dto.response.TokenResponse;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 인증 테스트")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @InjectMocks private AuthService authService;

    private static final Long USER_ID = 1L;

    @Test
    void 회원가입_성공시_토큰을_반환한다() {
        SignUpRequest request = new SignUpRequest("tester", "test@test.com", "password1!", "TestPlayer");
        User savedUser = TestFixtures.user(USER_ID);

        given(userRepository.existsByEmail(request.email())).willReturn(false);
        given(userRepository.existsByNickname(request.nickname())).willReturn(false);
        given(passwordEncoder.encode(request.password())).willReturn("encoded-password");
        given(userRepository.save(any(User.class))).willReturn(savedUser);
        given(jwtTokenProvider.generateToken(USER_ID, savedUser.getEmail())).willReturn("token");

        TokenResponse response = authService.signUp(request);

        assertThat(response.accessToken()).isEqualTo("token");
        assertThat(response.userId()).isEqualTo(USER_ID);
    }

    @Test
    void 중복_이메일로_회원가입시_예외가_발생한다() {
        SignUpRequest request = new SignUpRequest("tester", "test@test.com", "password1!", "TestPlayer");
        given(userRepository.existsByEmail(request.email())).willReturn(true);

        assertThatThrownBy(() -> authService.signUp(request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 사용 중인 이메일입니다.");
    }

    @Test
    void 중복_닉네임으로_회원가입시_예외가_발생한다() {
        SignUpRequest request = new SignUpRequest("tester", "test@test.com", "password1!", "TestPlayer");
        given(userRepository.existsByEmail(request.email())).willReturn(false);
        given(userRepository.existsByNickname(request.nickname())).willReturn(true);

        assertThatThrownBy(() -> authService.signUp(request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이미 사용 중인 닉네임입니다.");
    }

    @Test
    void 로그인_성공시_토큰을_반환한다() {
        LoginRequest request = new LoginRequest("test@test.com", "password1!");
        User user = TestFixtures.user(USER_ID);

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(user));
        given(passwordEncoder.matches(request.password(), user.getPassword())).willReturn(true);
        given(jwtTokenProvider.generateToken(USER_ID, user.getEmail())).willReturn("token");

        TokenResponse response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("token");
    }

    @Test
    void 존재하지_않는_이메일로_로그인시_예외가_발생한다() {
        LoginRequest request = new LoginRequest("notexist@test.com", "password1!");
        given(userRepository.findByEmail(request.email())).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    @Test
    void 비밀번호가_틀리면_예외가_발생한다() {
        LoginRequest request = new LoginRequest("test@test.com", "wrongpw!");
        User user = TestFixtures.user(USER_ID);

        given(userRepository.findByEmail(request.email())).willReturn(Optional.of(user));
        given(passwordEncoder.matches(request.password(), user.getPassword())).willReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}