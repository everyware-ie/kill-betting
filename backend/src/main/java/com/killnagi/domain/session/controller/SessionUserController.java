package com.killnagi.domain.session.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.session.service.SessionUserService;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.service.TeamConfigureBroadcaster;
import com.killnagi.domain.team.service.TeamConfigureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions/{sessionId}")
@RequiredArgsConstructor
public class SessionUserController {

    private final SessionUserService sessionUserService;
    private final TeamConfigureService teamConfigureService;
    private final TeamConfigureBroadcaster configureBroadcaster;

    @GetMapping("/participants")
    public ResponseEntity<ApiResponse<ConfigureStateMessage>> getConfigureState(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(teamConfigureService.buildConfigureState(sessionId)));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Void>> join(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionUserService.join(sessionId, userId);

        broadcastConfigureState(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("세션에 입장했습니다.", null));
    }

    @DeleteMapping("/leave")
    public ResponseEntity<ApiResponse<Void>> leave(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionUserService.leave(sessionId, userId);

        broadcastConfigureState(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("세션에서 퇴장했습니다.", null));
    }

    private void broadcastConfigureState(Long sessionId) {
        ConfigureStateMessage state = teamConfigureService.buildConfigureState(sessionId);
        configureBroadcaster.broadcast(sessionId, state);
    }
}
