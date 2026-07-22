package com.killnagi.domain.session.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("SessionRepository 쿼리 메서드 테스트")
class SessionRepositoryTest {

    @Autowired private SessionRepository sessionRepository;
    @Autowired private SessionUserRepository sessionUserRepository;
    @Autowired private UserRepository userRepository;

    private User host;
    private User member;
    private User unrelated;
    private Session session;

    @BeforeEach
    void setUp() {
        host = userRepository.save(TestFixtures.user(null, "host", "host@test.com"));
        member = userRepository.save(TestFixtures.user(null, "member", "member@test.com"));
        unrelated = userRepository.save(TestFixtures.user(null, "unrelated", "unrelated@test.com"));

        session = sessionRepository.save(TestFixtures.session(host));
        sessionUserRepository.save(SessionUser.builder()
                .session(session)
                .user(member)
                .build());
    }

    @Test
    void 호스트인_경우_내_세션_목록에_포함된다() {
        List<Session> sessions = sessionRepository.findSessionsByUserId(host.getId());
        assertThat(sessions).contains(session);
    }

    @Test
    void 세션에_입장한_사용자인_경우_내_세션_목록에_포함된다() {
        List<Session> sessions = sessionRepository.findSessionsByUserId(member.getId());
        assertThat(sessions).contains(session);
    }

    @Test
    void 관계없는_유저는_세션_목록에_포함되지_않는다() {
        List<Session> sessions = sessionRepository.findSessionsByUserId(unrelated.getId());
        assertThat(sessions).doesNotContain(session);
    }

    @Test
    @DisplayName("어드민 목록: 상태 필터로 해당 상태의 세션만 페이징 조회한다")
    void 상태_필터로_해당_상태의_세션만_페이징_조회한다() {
        // given: setUp의 session은 WAITING. 종료된 세션 1개 추가
        Session ended = sessionRepository.save(TestFixtures.session(host));
        ended.start();
        ended.end(null);
        sessionRepository.save(ended);

        // when
        Page<Session> waiting = sessionRepository.findByStatusWithHost(
                SessionStatus.WAITING, PageRequest.of(0, 10));

        // then
        assertThat(waiting.getContent()).extracting(Session::getStatus)
                .containsOnly(SessionStatus.WAITING);
        assertThat(waiting.getContent()).contains(session).doesNotContain(ended);
    }

    @Test
    @DisplayName("어드민 목록: 상태 필터 없이 전체 세션을 페이징하고 host를 함께 로딩한다")
    void 전체_세션을_페이징하고_host를_함께_로딩한다() {
        Session ended = sessionRepository.save(TestFixtures.session(host));
        ended.start();
        ended.end(null);
        sessionRepository.save(ended);

        Page<Session> page = sessionRepository.findAllWithHost(PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
        // fetch join된 host 접근이 트랜잭션 밖에서도 안전한지(N+1/지연로딩 없음) 확인
        assertThat(page.getContent()).allSatisfy(s ->
                assertThat(s.getHost().getNickname()).isNotNull());
    }
}
