package com.killnagi.domain.team.repository;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("TeamMemberRepository 쿼리 메서드 테스트")
class TeamMemberRepositoryTest {

    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;

    private Session session;
    private Team team;
    private User user;

    @BeforeEach
    void setUp() {
        user = userRepository.save(TestFixtures.user());
        User host = userRepository.save(TestFixtures.user(null, "host", "host@test.com"));
        session = sessionRepository.save(TestFixtures.session(host));
        team = teamRepository.save(TestFixtures.team(session));
    }

    @Test
    void 세션에_참여중인_유저가_존재하면_true를_반환한다() {
        teamMemberRepository.save(TestFixtures.member(team, user));

        assertThat(teamMemberRepository.existsByTeam_Session_IdAndUser_Id(session.getId(), user.getId())).isTrue();
    }

    @Test
    void 세션에_참여하지_않은_유저는_false를_반환한다() {
        assertThat(teamMemberRepository.existsByTeam_Session_IdAndUser_Id(session.getId(), user.getId())).isFalse();
    }

    @Test
    void 업로더_권한이_있는_유저가_존재하면_true를_반환한다() {
        teamMemberRepository.save(TestFixtures.uploader(team, user));

        assertThat(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(session.getId(), user.getId())).isTrue();
    }

    @Test
    void 업로더_권한이_없는_유저는_false를_반환한다() {
        teamMemberRepository.save(TestFixtures.member(team, user));

        assertThat(teamMemberRepository.existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(session.getId(), user.getId())).isFalse();
    }
}