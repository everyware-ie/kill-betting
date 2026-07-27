package com.killnagi.domain.user.dto.response;

import java.util.List;

/**
 * 즐겨찾기 목록 + 최근 함께한 닉네임.
 *
 * recentUnfavorited는 저장되는 값이 아니라 조회 시 계산되는 파생 데이터다.
 * 즐겨찾기에 아직 없는 것만, 최근 순으로 제한된 개수만 내려보낸다.
 */
public record FavoriteNicknameListResponse(
        List<FavoriteNicknameResponse> favorites,
        List<String> recentUnfavorited
) {}
