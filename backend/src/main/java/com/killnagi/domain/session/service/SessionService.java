package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.SessionDto;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RuleRepository ruleRepository;
    private final RuleSetRepository ruleSetRepository;

    @Transactional
    public SessionDto.SessionResponse createSession(Long hostUserId, SessionDto.CreateRequest request) {
        User host = userRepository.findById(hostUserId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        Session session = sessionRepository.save(Session.builder()
                .name(request.name())
                .roomUrl(generateUniqueRoomUrl())
                .host(host)
                .targetKills(request.targetKills())
                .timeLimitMinutes(request.timeLimitMinutes())
                .build());

        RuleSet ruleSet = ruleSetRepository.save(RuleSet.builder()
                .session(session)
                .build());

        if (request.rules() != null) {
            request.rules().forEach(ruleReq ->
                    ruleRepository.save(Rule.builder()
                            .ruleSet(ruleSet)
                            .ruleType(ruleReq.ruleType())
                            .operator(ruleReq.operator())
                            .value(ruleReq.value())
                            .build()));
        }

        session.assignCurrentRuleSet(ruleSet);

        return toResponse(session);
    }

    @Transactional
    public void startSession(Long sessionId, Long userId) {
        Session session = getSessionOrThrow(sessionId);
        if (!session.isHostedBy(userId)) {
            throw KillnagiException.forbidden("세션 호스트만 시작할 수 있습니다.");
        }
        List<Team> teams = teamRepository.findBySessionId(sessionId);
        if (teams.size() < 2) {
            throw KillnagiException.badRequest("최소 2팀이 필요합니다.");
        }
        session.start();
    }

    public SessionDto.ScoreboardResponse getScoreboard(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<Team> teams = teamRepository.findBySessionId(sessionId);

        List<SessionDto.TeamScoreDto> teamScores = teams.stream()
                .map(team -> new SessionDto.TeamScoreDto(
                        team.getId(),
                        team.getName(),
                        team.getTotalKills(),
                        team.getBonusKills(),
                        team.getPenaltyKills(),
                        team.getEffectiveKills(),
                        team.getMembers().stream()
                                .map(m -> new SessionDto.MemberScoreDto(
                                        m.getUserId(),
                                        m.getUserNickname(),
                                        m.getTotalKills()
                                )).toList()
                )).toList();

        return new SessionDto.ScoreboardResponse(
                session.getId(),
                session.getName(),
                session.getStatus(),
                teamScores
        );
    }

    public SessionDto.SessionResponse getSessionByRoomUrl(String roomUrl) {
        Session session = sessionRepository.findByRoomUrl(roomUrl)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
        return toResponse(session);
    }

    public List<SessionDto.SessionResponse> getMySessions(Long userId) {
        return sessionRepository.findSessionsByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private String generateUniqueRoomUrl() {
        String roomUrl;
        do {
            roomUrl = UUID.randomUUID().toString();
        } while (sessionRepository.existsByRoomUrl(roomUrl));
        return roomUrl;
    }

    private Session getSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
    }

    private SessionDto.SessionResponse toResponse(Session session) {
        return new SessionDto.SessionResponse(
                session.getId(),
                session.getName(),
                session.getRoomUrl(),
                session.getHostNickname(),
                session.getStatus(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt()
        );
    }
}