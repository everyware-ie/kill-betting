package com.killnagi.domain.team.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeams(sessionId)));
    }
}