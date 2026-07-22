package com.killnagi.domain.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

import jakarta.persistence.EntityManager;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("UserRepository 집계 쿼리 테스트")
class UserRepositoryTest {

    @Autowired private UserRepository userRepository;
    @Autowired private EntityManager entityManager;

    private static final LocalDateTime CUTOFF = LocalDateTime.of(2026, 7, 15, 0, 0);

    @Test
    @DisplayName("기준 시각 이후에 가입한 유저만 센다")
    void 기준_시각_이후에_가입한_유저만_센다() {
        // given: 기준 이전 1명, 기준 이후 2명
        saveUserWithCreatedAt("before", "before@test.com", CUTOFF.minusDays(1));
        saveUserWithCreatedAt("after1", "after1@test.com", CUTOFF.plusDays(1));
        saveUserWithCreatedAt("after2", "after2@test.com", CUTOFF.plusDays(3));

        // when
        long count = userRepository.countByCreatedAtAfter(CUTOFF);

        // then
        assertThat(count).isEqualTo(2L);
    }

    @Test
    @DisplayName("가입 유저가 없으면 0을 반환한다")
    void 가입_유저가_없으면_0을_반환한다() {
        assertThat(userRepository.countByCreatedAtAfter(CUTOFF)).isZero();
    }

    @Test
    @DisplayName("기준 시각 이전(경계 포함)에 가입한 관측 가능 유저만 센다")
    void 기준_시각_이전_경계_포함_유저만_센다() {
        // 기준 이전 1명, 경계(정확히 기준) 1명, 기준 이후 1명
        saveUserWithCreatedAt("before", "before@test.com", CUTOFF.minusDays(1));
        saveUserWithCreatedAt("boundary", "boundary@test.com", CUTOFF);
        saveUserWithCreatedAt("after", "after@test.com", CUTOFF.plusDays(1));

        long count = userRepository.countByCreatedAtLessThanEqual(CUTOFF);

        assertThat(count).isEqualTo(2L);
    }

    private void saveUserWithCreatedAt(String nickname, String email, LocalDateTime createdAt) {
        User user = userRepository.save(TestFixtures.user(null, nickname, email));
        // @CreatedDate 가 자동 설정한 값을 경계 검증용 시각으로 덮어쓴다
        entityManager.createNativeQuery("UPDATE users SET created_at = :createdAt WHERE id = :id")
                .setParameter("createdAt", createdAt)
                .setParameter("id", user.getId())
                .executeUpdate();
        entityManager.clear();
    }
}