package com.killnagi.domain.match.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import com.killnagi.domain.match.service.MatchConfirmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchConfirmService matchConfirmService;

    @PostMapping("/{matchId}/confirm")
    public ResponseEntity<ApiResponse<ConfirmResponse>> confirm(
            @PathVariable Long matchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        ConfirmResponse response = matchConfirmService.confirm(matchId, userId);
        return ResponseEntity.ok(ApiResponse.ok("매치 결과가 확정되었습니다.", response));
    }
}
