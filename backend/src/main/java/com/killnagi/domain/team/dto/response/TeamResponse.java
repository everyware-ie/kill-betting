package com.killnagi.domain.team.dto.response;

import java.util.List;

public record TeamResponse(Long id, String name, int effectiveKills, List<String> memberNicknames) {}
