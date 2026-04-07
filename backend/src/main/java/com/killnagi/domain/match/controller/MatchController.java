package com.killnagi.domain.match.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.MatchDto;
import com.killnagi.domain.match.service.MatchReflectService;
import com.killnagi.domain.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final MatchReflectService matchReflectService;

    @PostMapping("/{matchId}/screenshot")
    public ResponseEntity<ApiResponse<MatchDto.ScreenshotUploadResponse>> uploadScreenshot(
            @PathVariable Long matchId,
            @RequestParam("image") MultipartFile file) {
        MatchDto.ScreenshotUploadResponse response = matchService.uploadScreenshot(matchId, file);
        return ResponseEntity.ok(ApiResponse.ok("이미지가 업로드되었습니다.", response));
    }

    @PostMapping("/{matchId}/reflect")
    public ResponseEntity<ApiResponse<MatchDto.ReflectResponse>> reflect(
            @PathVariable Long matchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        MatchDto.ReflectResponse response = matchReflectService.reflect(matchId, userId);
        return ResponseEntity.ok(ApiResponse.ok("매치 결과가 반영되었습니다.", response));
    }
}
