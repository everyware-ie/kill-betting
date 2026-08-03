package com.killnagi.domain.match.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.request.ConfirmRequest;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import com.killnagi.domain.match.service.MatchConfirmService;
import com.killnagi.domain.match.service.MatchDeleteService;
import com.killnagi.domain.match.controller.docs.MatchControllerDocs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController implements MatchControllerDocs {

    private final MatchConfirmService matchConfirmService;
    private final MatchDeleteService matchDeleteService;

    @PostMapping("/{matchId}/confirm")
    public ResponseEntity<ApiResponse<ConfirmResponse>> confirm(
            @PathVariable Long matchId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ConfirmRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        ConfirmResponse response = matchConfirmService.confirm(matchId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("매치 결과가 확정되었습니다.", response));
    }

    @DeleteMapping("/{matchId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long matchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        matchDeleteService.delete(matchId, userId);
        return ResponseEntity.noContent().build();
    }
}
