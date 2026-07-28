package com.killnagi.domain.user.dto.response;

import com.killnagi.domain.user.entity.FavoriteNickname;

public record FavoriteNicknameResponse(
        Long id,
        String nickname
) {
    public static FavoriteNicknameResponse from(FavoriteNickname favorite) {
        return new FavoriteNicknameResponse(favorite.getId(), favorite.getNickname());
    }
}
