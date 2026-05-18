package com.killnagi.domain.team.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdjustmentRequest(
        @NotNull Integer amount,
        @NotBlank String reason
) {}
