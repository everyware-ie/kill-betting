package com.killnagi.domain.session.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.entity.SessionUser.SessionUserStatus;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

import jakarta.persistence.EntityManager;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("SessionUserRepository 집계 쿼리 테스트")
class SessionUserRepositoryTest {

    @Autowired private SessionUserRepository sessionUserRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EntityManager entityManager;

    private static final LocalDateTime CUTOFF = LocalDateTime.of(2026, 7, 15, 0, 0);

    @Test
    @DisplayName("상태별 참여 수를 센다")
    void 상태별_참여_수를_센다() {
        User host = userRepository.save(TestFixtures.user(null, "host", "host@test.com"));
        Session session = sessionRepository.save(TestFixtures.session(host));

        joinAndLeave(session, "left", "left@test.com");
        join(session, "active1", "active1@test.com");
        join(session, "active2", "active2@test.com");

        assertThat(sessionUserRepository.countByStatus(SessionUserStatus.ACTIVE)).isEqualTo(2L);
        assertThat(sessionUserRepository.countByStatus(SessionUserStatus.LEFT)).isEqualTo(1L);
    }

    @Test
    @DisplayName("기준 시각 이후 참여한 서로 다른 유저 수를 센다 (중복 유저는 1명)")
    void 기준_시각_이후_참여한_distinct_유저_수를_센다() {
        User host = userRepository.save(TestFixtures.user(null, "host", "host@test.com"));
        Session s1 = sessionRepository.save(TestFixtures.session(host));
        Session s2 = sessionRepository.save(TestFixtures.session(host));

        User repeater = userRepository.save(TestFixtures.user(null, "repeater", "repeater@test.com"));
        User oldUser = userRepository.save(TestFixtures.user(null, "old", "old@test.com"));

        // repeater: 기준 이후 두 세션에 참여 → distinct 1명
        joinWithJoinedAt(s1, repeater, CUTOFF.plusDays(1));
        joinWithJoinedAt(s2, repeater, CUTOFF.plusDays(2));
        // oldUser: 기준 이전 참여 → 제외
        joinWithJoinedAt(s1, oldUser, CUTOFF.minusDays(1));

        long count = sessionUserRepository.countDistinctUsersByJoinedAtAfter(CUTOFF);

        assertThat(count).isEqualTo(1L);
    }

    private void join(Session session, String nickname, String email) {
        User user = userRepository.save(TestFixtures.user(null, nickname, email));
        sessionUserRepository.save(SessionUser.builder().session(session).user(user).build());
    }

    private void joinAndLeave(Session session, String nickname, String email) {
        User user = userRepository.save(TestFixtures.user(null, nickname, email));
        SessionUser sessionUser = SessionUser.builder().session(session).user(user).build();
        sessionUser.leave();
        sessionUserRepository.save(sessionUser);
    }

    private void joinWithJoinedAt(Session session, User user, LocalDateTime joinedAt) {
        SessionUser sessionUser = sessionUserRepository.save(
                SessionUser.builder().session(session).user(user).build());
        // @CreatedDate(joined_at) 자동값을 경계 검증용 시각으로 덮어쓴다
        entityManager.createNativeQuery("UPDATE session_users SET joined_at = :joinedAt WHERE id = :id")
                .setParameter("joinedAt", joinedAt)
                .setParameter("id", sessionUser.getId())
                .executeUpdate();
        entityManager.clear();
    }
}