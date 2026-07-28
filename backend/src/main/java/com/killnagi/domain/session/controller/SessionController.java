package com.killnagi.domain.session.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.rule.dto.request.UpdateRuleRequest;
import com.killnagi.domain.session.dto.request.CreateRequest;
import com.killnagi.domain.session.dto.request.UpdateSettingsRequest;
import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.session.dto.response.MySessionResponse;
import com.killnagi.domain.session.dto.response.SessionDetailResponse;
import com.killnagi.domain.session.dto.response.SessionRenewResponse;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.service.SessionEndService;
import com.killnagi.domain.session.service.SessionMatchService;
import com.killnagi.domain.session.service.SessionQueryService;
import com.killnagi.domain.session.service.SessionRenewService;
import com.killnagi.domain.session.service.SessionService;
import com.killnagi.domain.session.service.SessionVisibilityService;
import com.killnagi.domain.session.controller.docs.SessionControllerDocs;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController implements SessionControllerDocs {

    private final SessionService sessionService;
    private final SessionEndService sessionEndService;
    private final SessionQueryService sessionQueryService;
    private final SessionMatchService sessionMatchService;
    private final SessionRenewService sessionRenewService;
    private final SessionVisibilityService sessionVisibilityService;

    @PostMapping
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("세션이 생성되었습니다.", sessionService.createSession(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessions(
            @RequestParam(required = false) String code) {
        if (code != null && !code.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(List.of(sessionQueryService.getSessionByRoomCode(code))));
        }
        return ResponseEntity.ok(ApiResponse.ok(sessionQueryService.getWaitingSessions()));
    }

    @GetMapping("/join/{roomCode}")
    public ResponseEntity<ApiResponse<SessionDetailResponse>> getSessionByRoomCode(
            @AuthenticationPrincipal(errorOnInvalidType = false) UserDetails userDetails,
            @PathVariable String roomCode) {
        SessionDetailResponse response = sessionQueryService.getSessionDetailByRoomCode(roomCode);
        if (userDetails != null) {
            sessionVisibilityService.restore(response.id(), Long.parseLong(userDetails.getUsername()));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
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
    public ResponseEntity<ApiResponse<ScoreboardResponse>> getScoreboard(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(sessionMatchService.getScoreboard(sessionId)));
    }

    @PostMapping("/{sessionId}/matches")
    public ResponseEntity<ApiResponse<ScreenshotUploadResponse>> uploadMatchImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestParam("image") MultipartFile file) {
        Long uploaderId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("이미지가 업로드되었습니다.", sessionMatchService.uploadMatchImage(sessionId, uploaderId, file)));
    }

    @GetMapping("/{sessionId}/match-history")
    public ResponseEntity<ApiResponse<MatchHistoryResponse>> getMatchHistory(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(sessionMatchService.getMatchHistory(sessionId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<MySessionResponse>>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(sessionQueryService.getMySessions(userId)));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<ApiResponse<Void>> endSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionEndService.endByHost(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok("세션이 종료되었습니다.", null));
    }

    @PostMapping("/{sessionId}/renew")
    public ResponseEntity<ApiResponse<SessionRenewResponse>> renewSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("새 세션이 생성되었습니다.", sessionRenewService.renew(sessionId, userId)));
    }

    @DeleteMapping("/{sessionId}/my")
    public ResponseEntity<ApiResponse<Void>> hideMySession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionVisibilityService.hide(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok("세션을 목록에서 삭제했습니다.", null));
    }

    @PatchMapping("/{sessionId}/settings")
    public ResponseEntity<ApiResponse<Void>> updateSettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @Valid @RequestBody UpdateSettingsRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionService.updateSettings(sessionId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("세션 설정이 수정되었습니다.", null));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionService.deleteByHost(sessionId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{sessionId}/rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> updateRule(
            @PathVariable Long sessionId,
            @PathVariable Long ruleId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateRuleRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        sessionService.updateRule(sessionId, ruleId, request.value(), userId);
        return ResponseEntity.ok(ApiResponse.ok("룰이 수정되었습니다.", null));
    }
}
