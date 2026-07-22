package com.killnagi.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.admin.dto.response.AdminMetricsResponse;
import com.killnagi.domain.admin.service.AdminMetricsService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminMetricsService adminMetricsService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<AdminMetricsResponse>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(adminMetricsService.getMetrics()));
    }
}
