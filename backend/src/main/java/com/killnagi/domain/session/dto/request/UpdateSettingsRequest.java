package com.killnagi.domain.session.dto.request;

// targetKills·timeLimitMinutes는 선택값 — timeLimitMinutes null은 제한시간 제거를 의미.
// 값 범위 검증(1 이상)은 도메인(Session.updateSettings)에서 수행한다.
public record UpdateSettingsRequest(
        Integer targetKills,
        Integer timeLimitMinutes
) {}
