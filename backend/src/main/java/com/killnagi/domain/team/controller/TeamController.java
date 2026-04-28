package com.killnagi.domain.team.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.request.AddPlayerRequest;
import com.killnagi.domain.team.dto.request.AssignOperatorRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.request.UpdatePlayerRequest;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.service.TeamConfigureBroadcaster;
import com.killnagi.domain.team.service.TeamConfigureService;
import com.killnagi.domain.team.service.TeamService;
import com.killnagi.domain.team.controller.docs.TeamControllerDocs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/teams")
@RequiredArgsConstructor
public class TeamController implements TeamControllerDocs {

    private final TeamService teamService;
    private final TeamConfigureService teamConfigureService;
    private final TeamConfigureBroadcaster configureBroadcaster;

    @PostMapping
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody CreateTeamRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        TeamResponse response = teamService.createTeam(sessionId, userId, request);
        broadcastConfigureState(sessionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("팀이 생성되었습니다.", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeams(sessionId)));
    }

    @PostMapping("/{teamId}/players")
    public ResponseEntity<ApiResponse<Void>> addPlayer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @RequestBody AddPlayerRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        teamConfigureService.addPlayer(sessionId, teamId, userId, request.playerNickname());
        broadcastConfigureState(sessionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("플레이어가 추가되었습니다.", null));
    }

    @PatchMapping("/{teamId}/players/{playerId}")
    public ResponseEntity<ApiResponse<Void>> updatePlayer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @PathVariable Long playerId,
            @RequestBody UpdatePlayerRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        teamConfigureService.updatePlayer(sessionId, teamId, playerId, userId, request.playerNickname());
        broadcastConfigureState(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("플레이어 닉네임이 수정되었습니다.", null));
    }

    @DeleteMapping("/{teamId}/players/{playerId}")
    public ResponseEntity<ApiResponse<Void>> removePlayer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @PathVariable Long playerId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        teamConfigureService.removePlayer(sessionId, teamId, playerId, userId);
        broadcastConfigureState(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("플레이어가 제거되었습니다.", null));
    }

    @PutMapping("/{teamId}/operator")
    public ResponseEntity<ApiResponse<Void>> assignOperator(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @PathVariable Long teamId,
            @RequestBody AssignOperatorRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        teamConfigureService.assignOperator(sessionId, teamId, userId, request.userId());
        broadcastConfigureState(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Operator가 배정되었습니다.", null));
    }

    private void broadcastConfigureState(Long sessionId) {
        ConfigureStateMessage state = teamConfigureService.buildConfigureState(sessionId);
        configureBroadcaster.broadcast(sessionId, state);
    }
}
