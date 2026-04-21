package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.dto.SessionDto.CreateRequest;
import com.killnagi.domain.session.dto.SessionDto.MemberScoreDto;
import com.killnagi.domain.session.dto.SessionDto.RuleRequest;
import com.killnagi.domain.session.dto.SessionDto.ScoreboardResponse;
import com.killnagi.domain.session.dto.SessionDto.SessionResponse;
import com.killnagi.domain.session.dto.SessionDto.TeamScoreDto;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionService {

    private static final int MIN_TEAMS_TO_START = 2;

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RuleRepository ruleRepository;

    @Transactional
    public SessionResponse createSession(Long hostUserId, CreateRequest request) {
        User host = userRepository.findById(hostUserId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        Session saved = sessionRepository.save(buildSession(request, host));

        if (request.rules() != null) {
            request.rules().forEach(rule -> ruleRepository.save(buildRule(rule, saved)));
        }

        return toResponse(saved);
    }

    private Rule buildRule(RuleRequest ruleReq, Session saved) {
        return Rule.builder()
                .session(saved)
                .ruleType(ruleReq.ruleType())
                .killValue(ruleReq.killValue())
                .build();
    }

    private Session buildSession(CreateRequest request, User host) {
        return Session.builder()
                .name(request.name())
                .host(host)
                .targetKills(request.targetKills())
                .timeLimitMinutes(request.timeLimitMinutes())
                .build();
    }

    @Transactional
    public void startSession(Long sessionId, Long userId) {
        Session session = getSessionOrThrow(sessionId);
        if (!session.isHostedBy(userId)) {
            throw KillnagiException.forbidden("세션 호스트만 시작할 수 있습니다.");
        }
        List<Team> teams = teamRepository.findBySessionId(sessionId);
        if (teams.size() < MIN_TEAMS_TO_START) {
            throw KillnagiException.badRequest("최소 " + MIN_TEAMS_TO_START + "팀이 필요합니다.");
        }
        session.start();
    }

    public ScoreboardResponse getScoreboard(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<Team> teams = teamRepository.findBySessionId(sessionId);

        List<TeamScoreDto> teamScores = teams.stream()
                .map(team -> new TeamScoreDto(
                        team.getId(),
                        team.getName(),
                        team.getTotalKills(),
                        team.getBonusKills(),
                        team.getPenaltyKills(),
                        team.getEffectiveKills(),
                        team.getMembers().stream()
                                .map(m -> new MemberScoreDto(
                                        m.getUserId(),
                                        m.getUserNickname(),
                                        m.getTotalKills()
                                )).toList()
                )).toList();

        return new ScoreboardResponse(
                session.getId(),
                session.getName(),
                session.getStatus(),
                teamScores
        );
    }

    public List<SessionResponse> getMySessions(Long userId) {
        return sessionRepository.findSessionsByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private Session getSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
    }

    private SessionResponse toResponse(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getName(),
                session.getHostNickname(),
                session.getStatus(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt()
        );
    }
}
