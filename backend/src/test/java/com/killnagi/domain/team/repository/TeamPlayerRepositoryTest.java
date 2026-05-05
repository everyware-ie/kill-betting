package com.killnagi.domain.team.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import com.killnagi.config.JpaConfig;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("TeamPlayerRepository 쿼리 메서드 테스트")
class TeamPlayerRepositoryTest {

    @Autowired private TeamPlayerRepository teamPlayerRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;

    private Team team;

    @BeforeEach
    void setUp() {
        User host = userRepository.save(TestFixtures.user(null, "host", "host@test.com"));
        Session session = sessionRepository.save(TestFixtures.session(host));
        team = teamRepository.save(TestFixtures.team(session));
    }

    @Test
    void 팀에_플레이어가_있으면_count가_1이다() {
        teamPlayerRepository.save(TestFixtures.player(team, "TestPlayer"));

        assertThat(teamPlayerRepository.countByTeam_Id(team.getId())).isEqualTo(1);
    }

    @Test
    void 팀에_플레이어가_없으면_count가_0이다() {
        assertThat(teamPlayerRepository.countByTeam_Id(team.getId())).isEqualTo(0);
    }

    @Test
    void 동일_닉네임이_존재하면_true를_반환한다() {
        teamPlayerRepository.save(TestFixtures.player(team, "DupNick"));

        assertThat(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(team.getId(), "DupNick")).isTrue();
    }

    @Test
    void 닉네임이_없으면_false를_반환한다() {
        assertThat(teamPlayerRepository.existsByTeam_IdAndPlayerNickname(team.getId(), "NotExist")).isFalse();
    }
}
