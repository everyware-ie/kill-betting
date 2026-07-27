package com.killnagi.domain.user.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.team.service.TeamService;
import com.killnagi.domain.user.dto.response.FavoriteNicknameListResponse;
import com.killnagi.domain.user.dto.response.FavoriteNicknameResponse;
import com.killnagi.domain.user.entity.FavoriteNickname;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.FavoriteNicknameRepository;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteNicknameService {

    static final int MAX_FAVORITES_PER_USER = 20;
    static final int MAX_RECENT_UNFAVORITED = 10;

    private final FavoriteNicknameRepository favoriteNicknameRepository;
    private final UserRepository userRepository;
    private final TeamService teamService;

    public FavoriteNicknameListResponse getFavorites(Long userId) {
        List<FavoriteNicknameResponse> favorites =
                favoriteNicknameRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                        .map(FavoriteNicknameResponse::from)
                        .toList();

        return new FavoriteNicknameListResponse(favorites, findRecentUnfavorited(userId, favorites));
    }

    /**
     * 내가 리더였던 최근 세션에서 등록한 닉네임 중 아직 즐겨찾기에 없는 것.
     * 즐겨찾기로 걸러낸 뒤에도 개수를 채우기 위해 상한보다 넉넉히 조회한다.
     */
    private List<String> findRecentUnfavorited(Long userId, List<FavoriteNicknameResponse> favorites) {
        Set<String> alreadyFavorited = favorites.stream()
                .map(FavoriteNicknameResponse::nickname)
                .collect(Collectors.toSet());

        return teamService
                .getRecentPlayerNicknamesByLeader(userId, MAX_RECENT_UNFAVORITED + MAX_FAVORITES_PER_USER)
                .stream()
                .filter(nickname -> !alreadyFavorited.contains(nickname))
                .limit(MAX_RECENT_UNFAVORITED)
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
