package com.killnagi.domain.session.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.session.entity.HiddenSession;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("HiddenSessionRepository 쿼리 메서드 테스트")
class HiddenSessionRepositoryTest {

    @Autowired private HiddenSessionRepository hiddenSessionRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;

    private User user;
    private Session session;

    @BeforeEach
    void setUp() {
        user = userRepository.save(TestFixtures.user(null, "user", "user@test.com"));
        User host = userRepository.save(TestFixtures.user(null, "host", "host@test.com"));
        session = sessionRepository.save(TestFixtures.session(host));

        hiddenSessionRepository.save(HiddenSession.builder()
                .session(session)
                .user(user)
                .build());
    }

    @Test
    void 숨긴_세션_ID를_사용자별로_조회한다() {
        Set<Long> hiddenSessionIds = hiddenSessionRepository.findSessionIdsByUserId(user.getId());
        assertThat(hiddenSessionIds).containsExactly(session.getId());
    }

    @Test
    void 숨김_여부를_존재_확인으로_조회한다() {
        assertThat(hiddenSessionRepository.existsBySession_IdAndUser_Id(session.getId(), user.getId())).isTrue();
    }

    @Test
    void 숨김을_해제하면_더_이상_조회되지_않는다() {
        hiddenSessionRepository.deleteBySessionIdAndUserId(session.getId(), user.getId());

        assertThat(hiddenSessionRepository.existsBySession_IdAndUser_Id(session.getId(), user.getId())).isFalse();
    }
}
