package com.killnagi.domain.session.repository;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.team.repository.TeamMemberRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("SessionRepository 쿼리 메서드 테스트")
class SessionRepositoryTest {

    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;

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
        Team team = teamRepository.save(TestFixtures.team(session));
        teamMemberRepository.save(TestFixtures.member(team, member));
    }

    @Test
    void 호스트인_경우_내_세션_목록에_포함된다() {
        List<Session> sessions = sessionRepository.findSessionsByUserId(host.getId());
        assertThat(sessions).contains(session);
    }

    @Test
    void 팀원인_경우_내_세션_목록에_포함된다() {
        List<Session> sessions = sessionRepository.findSessionsByUserId(member.getId());
        assertThat(sessions).contains(session);
    }

    @Test
    void 관계없는_유저는_세션_목록에_포함되지_않는다() {
        List<Session> sessions = sessionRepository.findSessionsByUserId(unrelated.getId());
        assertThat(sessions).doesNotContain(session);
    }
}