package com.killnagi.domain.session.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.session.dto.SessionDto;
import com.killnagi.domain.session.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SessionDto.SessionResponse>> createSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SessionDto.CreateRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("세션이 생성되었습니다.", sessionService.createSession(userId, request)));
    }

    @GetMapping("/join/{roomUrl}")
    public ResponseEntity<ApiResponse<SessionDto.SessionResponse>> getSessionByRoomUrl(
            @PathVariable String roomUrl) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getSessionByRoomUrl(roomUrl)));
    }

    @PostMapping("/{sessionId}/start")
    public ResponseEntity<ApiResponse<Void>> startSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionService.startSession(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok("세션이 시작되었습니다.", null));
    }

    @GetMapping("/{sessionId}/scoreboard")
    public ResponseEntity<ApiResponse<SessionDto.ScoreboardResponse>> getScoreboard(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getScoreboard(sessionId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<SessionDto.SessionResponse>>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getMySessions(userId)));
    }
}