package com.killnagi.support;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.Rule.RuleType;
import com.killnagi.domain.rule.entity.Rule.Operator;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.user.entity.User;
import org.springframework.test.util.ReflectionTestUtils;

public class TestFixtures {

    public static User user() {
        return User.builder()
                .nickname("tester")
                .email("test@test.com")
                .password("encoded-password")
                .pubgNickname("TestPlayer")
                .build();
    }

    public static User user(Long id) {
        User u = user();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    public static User user(Long id, String nickname, String email) {
        User u = User.builder()
                .nickname(nickname)
                .email(email)
                .password("encoded-password")
                .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    public static Session session(User host) {
        return Session.builder()
                .name("킬내기 세션")
                .roomUrl(java.util.UUID.randomUUID().toString())
                .host(host)
                .targetKills(50)
                .timeLimitMinutes(60)
                .build();
    }

    public static Session session(Long id, User host) {
        Session s = session(host);
        ReflectionTestUtils.setField(s, "id", id);
        return s;
    }

    public static Team team(Session session) {
        return Team.builder()
                .session(session)
                .name("팀A")
                .build();
    }

    public static TeamMember member(Team team, User user) {
        return TeamMember.builder()
                .team(team)
                .user(user)
                .build();
    }

    public static TeamMember uploader(Team team, User user) {
        return TeamMember.builder()
                .team(team)
                .user(user)
                .isUploader(true)
                .build();
    }

    public static Match match(Session session) {
        return Match.builder()
                .session(session)
                .matchNumber(1)
                .build();
    }

    public static Match match(Long id, Session session) {
        Match m = match(session);
        ReflectionTestUtils.setField(m, "id", id);
        return m;
    }

    public static MatchResult matchResult(Match match, TeamMember member, int kills, int placement) {
        return MatchResult.builder()
                .match(match)
                .teamMember(member)
                .kills(kills)
                .placement(placement)
                .build();
    }

    public static MatchResult matchResult(Match match, TeamMember member, int kills) {
        return MatchResult.builder()
                .match(match)
                .teamMember(member)
                .kills(kills)
                .placement(null)
                .build();
    }

    public static Rule rule(Session session, RuleType type, int value) {
        RuleSet ruleSet = RuleSet.builder().session(session).build();
        return Rule.builder()
                .ruleSet(ruleSet)
                .ruleType(type)
                .operator(Operator.EQ)
                .value(value)
                .build();
    }

    public static Rule rule(Session session, RuleType type, Operator operator, int value) {
        RuleSet ruleSet = RuleSet.builder().session(session).build();
        return Rule.builder()
                .ruleSet(ruleSet)
                .ruleType(type)
                .operator(operator)
                .value(value)
                .build();
    }
}