package com.killnagi.domain.team.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.request.AddMemberRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.service.TeamService;
import com.killnagi.domain.team.controller.docs.TeamControllerDocs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
public class TeamController implements TeamControllerDocs {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody CreateTeamRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("팀이 생성되었습니다.", teamService.createTeam(sessionId, userId, request)));
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<ApiResponse<TeamResponse>> addMember(
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("멤버가 추가되었습니다.", teamService.addMember(sessionId, teamId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeams(sessionId)));
    }
}
