package com.killnagi.domain.session.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateRequest(
        @NotBlank(message = "세션 이름을 입력해주세요")
        @Size(max = 100)
        String name,
        Integer targetKills,
        Integer timeLimitMinutes,
        List<RuleRequest> rules
) {}