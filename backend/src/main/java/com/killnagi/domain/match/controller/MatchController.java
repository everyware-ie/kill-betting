package com.killnagi.domain.match.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.MatchDto.ConfirmResponse;
import com.killnagi.domain.match.dto.MatchDto.ScreenshotUploadResponse;
import com.killnagi.domain.match.service.MatchConfirmService;
import com.killnagi.domain.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final MatchConfirmService matchConfirmService;

    @PostMapping("/{matchId}/screenshot")
    public ResponseEntity<ApiResponse<ScreenshotUploadResponse>> uploadScreenshot(
            @PathVariable Long matchId,
            @RequestParam("image") MultipartFile file) {
        ScreenshotUploadResponse response = matchService.uploadScreenshot(matchId, file);
        return ResponseEntity.ok(ApiResponse.ok("이미지가 업로드되었습니다.", response));
    }

    @PostMapping("/{matchId}/confirm")
    public ResponseEntity<ApiResponse<ConfirmResponse>> confirm(
            @PathVariable Long matchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        ConfirmResponse response = matchConfirmService.confirm(matchId, userId);
        return ResponseEntity.ok(ApiResponse.ok("매치 결과가 확정되었습니다.", response));
    }
}
