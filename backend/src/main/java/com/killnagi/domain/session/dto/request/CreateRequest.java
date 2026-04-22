package com.killnagi.domain.session.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.killnagi.domain.rule.entity.RuleType;

public record CreateRequest(
        @NotBlank(message = "세션 이름을 입력해주세요")
        @Size(max = 100)
        String name,
        Integer targetKills,
        Integer timeLimitMinutes,
        List<RuleRequest> rules
) {
}

