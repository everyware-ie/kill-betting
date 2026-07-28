package com.killnagi.domain.user.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.user.dto.response.FavoriteNicknameResponse;
import com.killnagi.domain.user.entity.FavoriteNickname;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.FavoriteNicknameRepository;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteNicknameService {

    static final int MAX_FAVORITES_PER_USER = 20;

    private final FavoriteNicknameRepository favoriteNicknameRepository;
    private final UserRepository userRepository;

    public List<FavoriteNicknameResponse> getFavorites(Long userId) {
        return favoriteNicknameRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(FavoriteNicknameResponse::from)
                .toList();
    }

    @Transactional
    public FavoriteNicknameResponse addFavorite(Long userId, String nickname) {
        if (favoriteNicknameRepository.countByUser_Id(userId) >= MAX_FAVORITES_PER_USER) {
            throw KillnagiException.badRequest(
                    "즐겨찾기는 최대 " + MAX_FAVORITES_PER_USER + "개까지 등록할 수 있습니다.");
        }

        if (favoriteNicknameRepository.existsByUser_IdAndNickname(userId, nickname)) {
            throw KillnagiException.badRequest("이미 즐겨찾기에 등록된 닉네임입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        FavoriteNickname saved = favoriteNicknameRepository.save(FavoriteNickname.builder()
                .user(user)
                .nickname(nickname)
                .build());

        return FavoriteNicknameResponse.from(saved);
    }

    @Transactional
    public void removeFavorite(Long userId, Long favoriteId) {
        // 본인 소유가 아니면 조회되지 않는다 — 존재 여부를 노출하지 않기 위해 404로 처리
        FavoriteNickname favorite = favoriteNicknameRepository.findByIdAndUser_Id(favoriteId, userId)
                .orElseThrow(() -> KillnagiException.notFound("즐겨찾기를 찾을 수 없습니다."));

        favoriteNicknameRepository.delete(favorite);
    }
}
