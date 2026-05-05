package com.killnagi.support;

import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.rule.entity.Operator;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.entity.RuleType;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.user.entity.User;

public class TestFixtures {

    public static User user() {
        return User.builder()
                .nickname("tester")
                .email("test@test.com")
                .password("encoded-password")
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
                .roomCode(java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase())
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

    public static TeamPlayer player(Team team, String playerNickname) {
        return TeamPlayer.builder()
                .team(team)
                .playerNickname(playerNickname)
                .build();
    }

    public static TeamPlayer player(Team team) {
        return player(team, "TestPlayer");
    }

    public static Match match(Session session) {
        return Match.builder()
                .session(session)
                .matchNumber(1)
                .build();
    }

    public static Match match(Session session, Team team) {
        return Match.builder()
                .session(session)
                .team(team)
                .matchNumber(1)
                .build();
    }

    public static Match match(Long id, Session session) {
        Match m = match(session);
        ReflectionTestUtils.setField(m, "id", id);
        return m;
    }

    public static MatchResult matchResult(Match match, TeamPlayer player, int kills, int placement) {
        return MatchResult.builder()
                .match(match)
                .teamPlayer(player)
                .kills(kills)
                .placement(placement)
                .build();
    }

    public static MatchResult matchResult(Match match, TeamPlayer player, int kills) {
        return MatchResult.builder()
                .match(match)
                .teamPlayer(player)
                .kills(kills)
                .placement(null)
                .build();
    }

    public static Rule rule(Session session, RuleType type, int value) {
        RuleSet ruleSet = RuleSet.builder().session(session).build();
        return Rule.builder()
                .ruleSet(ruleSet)
                .ruleType(type)
                .operator(Operator.PLUS)
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
