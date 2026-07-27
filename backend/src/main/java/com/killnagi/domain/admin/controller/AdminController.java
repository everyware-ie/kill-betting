package com.killnagi.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.admin.dto.response.AdminMetricsResponse;
import com.killnagi.domain.admin.dto.response.AdminSessionDetailResponse;
import com.killnagi.domain.admin.dto.response.AdminSessionSummaryResponse;
import com.killnagi.domain.admin.service.AdminMetricsService;
import com.killnagi.domain.admin.service.AdminSessionService;
import com.killnagi.domain.session.entity.Session.SessionStatus;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminMetricsService adminMetricsService;
    private final AdminSessionService adminSessionService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminMetricsResponse>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(adminMetricsService.getMetrics()));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<Page<AdminSessionSummaryResponse>>> getSessions(
            @RequestParam(required = false) SessionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminSessionService.getSessions(status, pageable)));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<AdminSessionDetailResponse>> getSessionDetail(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(adminSessionService.getSessionDetail(sessionId)));
    }
}
