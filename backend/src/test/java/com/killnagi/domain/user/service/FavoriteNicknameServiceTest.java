package com.killnagi.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.user.dto.response.FavoriteNicknameResponse;
import com.killnagi.domain.user.entity.FavoriteNickname;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.FavoriteNicknameRepository;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("닉네임 즐겨찾기 서비스 테스트")
class FavoriteNicknameServiceTest {

    @Mock private FavoriteNicknameRepository favoriteNicknameRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private FavoriteNicknameService favoriteNicknameService;

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long FAVORITE_ID = 100L;

    @Test
    @DisplayName("본인의 즐겨찾기 목록을 조회한다")
    void 본인의_즐겨찾기_목록을_조회한다() {
        User user = TestFixtures.user(USER_ID);
        given(favoriteNicknameRepository.findByUser_IdOrderByCreatedAtDesc(USER_ID))
                .willReturn(List.of(favorite(FAVORITE_ID, user, "친구1"), favorite(101L, user, "친구2")));

        List<FavoriteNicknameResponse> favorites = favoriteNicknameService.getFavorites(USER_ID);

        assertThat(favorites).hasSize(2);
        assertThat(favorites).extracting(FavoriteNicknameResponse::nickname)
                .containsExactly("친구1", "친구2");
    }

    @Test
    @DisplayName("즐겨찾기를 추가하면 저장된다")
    void 즐겨찾기를_추가하면_저장된다() {
        User user = TestFixtures.user(USER_ID);
        given(favoriteNicknameRepository.countByUser_Id(USER_ID)).willReturn(0);
        given(favoriteNicknameRepository.existsByUser_IdAndNickname(USER_ID, "친구1")).willReturn(false);
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(favoriteNicknameRepository.save(any(FavoriteNickname.class)))
                .willAnswer(inv -> inv.getArgument(0));

        FavoriteNicknameResponse response = favoriteNicknameService.addFavorite(USER_ID, "친구1");

        assertThat(response.nickname()).isEqualTo("친구1");
        then(favoriteNicknameRepository).should().save(any(FavoriteNickname.class));
    }

    @Test
    @DisplayName("즐겨찾기가 20개면 더 추가할 수 없다")
    void 즐겨찾기가_상한이면_추가시_예외가_발생한다() {
        given(favoriteNicknameRepository.countByUser_Id(USER_ID)).willReturn(20);

        assertThatThrownBy(() -> favoriteNicknameService.addFavorite(USER_ID, "친구1"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("20");
    }

    @Test
    @DisplayName("이미 등록한 닉네임은 중복 추가할 수 없다")
    void 이미_등록된_닉네임을_추가하면_예외가_발생한다() {
        given(favoriteNicknameRepository.countByUser_Id(USER_ID)).willReturn(3);
        given(favoriteNicknameRepository.existsByUser_IdAndNickname(USER_ID, "친구1")).willReturn(true);

        assertThatThrownBy(() -> favoriteNicknameService.addFavorite(USER_ID, "친구1"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("이미");
    }

    @Test
    @DisplayName("본인의 즐겨찾기를 삭제한다")
    void 본인의_즐겨찾기를_삭제한다() {
        User user = TestFixtures.user(USER_ID);
        FavoriteNickname favorite = favorite(FAVORITE_ID, user, "친구1");
        given(favoriteNicknameRepository.findByIdAndUser_Id(FAVORITE_ID, USER_ID))
                .willReturn(Optional.of(favorite));

        favoriteNicknameService.removeFavorite(USER_ID, FAVORITE_ID);

        then(favoriteNicknameRepository).should().delete(favorite);
    }

    @Test
    @DisplayName("다른 사용자의 즐겨찾기는 삭제할 수 없다")
    void 타인의_즐겨찾기를_삭제하면_예외가_발생한다() {
        given(favoriteNicknameRepository.findByIdAndUser_Id(FAVORITE_ID, OTHER_USER_ID))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteNicknameService.removeFavorite(OTHER_USER_ID, FAVORITE_ID))
                .isInstanceOf(KillnagiException.class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FavoriteNickname favorite(Long id, User user, String nickname) {
        FavoriteNickname favorite = FavoriteNickname.builder()
                .user(user)
                .nickname(nickname)
                .build();
        ReflectionTestUtils.setField(favorite, "id", id);
        return favorite;
    }
}
