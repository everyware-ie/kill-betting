package com.killnagi.domain.session.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.service.TeamConfigureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions/{sessionId}")
@RequiredArgsConstructor
public class SessionUserController {

    private final TeamConfigureService teamConfigureService;

    @GetMapping("/participants")
    public ResponseEntity<ApiResponse<ConfigureStateMessage>> getConfigureState(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamConfigureService.buildConfigureState(sessionId)));
    }
}