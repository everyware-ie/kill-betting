package com.killnagi.domain.team.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ApiResponse<TeamService.TeamResponse>> createTeam(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody TeamService.CreateTeamRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("팀이 생성되었습니다.", teamService.createTeam(sessionId, userId, request)));
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<ApiResponse<TeamService.TeamResponse>> addMember(
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @RequestBody TeamService.AddMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("멤버가 추가되었습니다.", teamService.addMember(sessionId, teamId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamService.TeamResponse>>> getTeams(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeams(sessionId)));
    }
}
