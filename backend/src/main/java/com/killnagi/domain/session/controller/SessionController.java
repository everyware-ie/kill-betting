package com.killnagi.domain.session.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.MatchDto;
import com.killnagi.domain.session.dto.SessionDto;
import com.killnagi.domain.session.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping("/{sessionId}/matches")
    public ResponseEntity<ApiResponse<MatchDto.ScreenshotUploadResponse>> uploadMatchImage(
            @PathVariable Long sessionId,
            @RequestParam("image") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("이미지가 업로드되었습니다.", sessionService.uploadMatchImage(sessionId, file)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<SessionDto.SessionResponse>>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getMySessions(userId)));
    }
}
