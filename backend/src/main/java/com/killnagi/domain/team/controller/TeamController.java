package com.killnagi.domain.team.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.request.AdjustmentRequest;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.service.TeamAdjustmentService;
import com.killnagi.domain.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final TeamAdjustmentService teamAdjustmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeams(sessionId)));
    }

    @PostMapping("/{teamId}/adjustments")
    public ResponseEntity<ApiResponse<Void>> applyAdjustment(
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AdjustmentRequest request) {
        Long hostUserId = Long.parseLong(userDetails.getUsername());
        teamAdjustmentService.applyAdjustment(sessionId, teamId, hostUserId, request.amount(), request.reason());
        return ResponseEntity.ok(ApiResponse.ok("점수가 조정되었습니다.", null));
    }
}