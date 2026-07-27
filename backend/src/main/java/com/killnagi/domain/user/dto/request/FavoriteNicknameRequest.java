package com.killnagi.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FavoriteNicknameRequest(
        @NotBlank(message = "닉네임을 입력해주세요.")
        @Size(max = 100, message = "닉네임은 100자 이하여야 합니다.")
        @Pattern(regexp = "\\S+", message = "배그 닉네임에는 공백을 사용할 수 없습니다.")
        String nickname
) {}
