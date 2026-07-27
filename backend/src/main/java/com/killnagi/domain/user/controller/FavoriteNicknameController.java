package com.killnagi.domain.user.controller;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.user.dto.request.FavoriteNicknameRequest;
import com.killnagi.domain.user.dto.response.FavoriteNicknameResponse;
import com.killnagi.domain.user.service.FavoriteNicknameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/favorite-nicknames")
@RequiredArgsConstructor
public class FavoriteNicknameController {

    private final FavoriteNicknameService favoriteNicknameService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FavoriteNicknameResponse>>> getFavorites(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(favoriteNicknameService.getFavorites(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FavoriteNicknameResponse>> addFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FavoriteNicknameRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.ok(favoriteNicknameService.addFavorite(userId, request.nickname())));
    }

    @DeleteMapping("/{favoriteId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long favoriteId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        favoriteNicknameService.removeFavorite(userId, favoriteId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
