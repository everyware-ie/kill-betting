package com.killnagi.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    public record SignUpRequest(
            @NotBlank(message = "닉네임을 입력해주세요")
            @Size(min = 2, max = 20, message = "닉네임은 2~20자 사이여야 합니다")
            String nickname,

            @NotBlank(message = "이메일을 입력해주세요")
            @Email(message = "올바른 이메일 형식을 입력해주세요")
            String email,

            @NotBlank(message = "비밀번호를 입력해주세요")
            @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다")
            String password,

            String pubgNickname
    ) {}

    public record LoginRequest(
            @NotBlank(message = "이메일을 입력해주세요")
            String email,

            @NotBlank(message = "비밀번호를 입력해주세요")
            String password
    ) {}

    public record TokenResponse(
            String accessToken,
            String tokenType,
            Long userId,
            String nickname
    ) {
        public static TokenResponse of(String token, Long userId, String nickname) {
            return new TokenResponse(token, "Bearer", userId, nickname);
        }
    }

    public record UserInfoResponse(
            Long id,
            String nickname,
            String email,
            String pubgNickname,
            int totalSessions,
            int wins,
            int losses,
            double winRate
    ) {}
}
