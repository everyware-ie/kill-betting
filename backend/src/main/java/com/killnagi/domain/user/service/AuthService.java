package com.killnagi.domain.user.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.common.security.JwtTokenProvider;
import com.killnagi.domain.user.dto.request.LoginRequest;
import com.killnagi.domain.user.dto.request.SignUpRequest;
import com.killnagi.domain.user.dto.response.TokenResponse;
import com.killnagi.domain.user.dto.response.UserInfoResponse;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public TokenResponse signUp(SignUpRequest request) {
        checkDuplicatedEmailAndPassword(request);

        User saved = userRepository.save(buildUser(request));
        String token = jwtTokenProvider.generateToken(saved.getId(), saved.getEmail());
        return TokenResponse.of(token, saved.getId(), saved.getNickname());
    }

    private void checkDuplicatedEmailAndPassword(SignUpRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw KillnagiException.badRequest("이미 사용 중인 이메일입니다.");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw KillnagiException.badRequest("이미 사용 중인 닉네임입니다.");
        }
    }

    private User buildUser(SignUpRequest request) {
        return User.builder()
                .nickname(request.nickname())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
    }

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> KillnagiException.unauthorized("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw KillnagiException.unauthorized("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        return TokenResponse.of(token, user.getId(), user.getNickname());
    }

    public UserInfoResponse getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        return new UserInfoResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getPubgNickname(),
                user.getTotalSessions(),
                user.getWins(),
                user.getLosses(),
                user.getWinRate()
        );
    }
}
