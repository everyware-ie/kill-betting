package com.killnagi.domain.user.dto.response;

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
