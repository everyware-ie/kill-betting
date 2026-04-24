package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.MatchDto;
import com.killnagi.domain.match.service.MatchService;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.dto.SessionDto;
import com.killnagi.domain.session.dto.SessionDto.CreateRequest;
import com.killnagi.domain.session.dto.SessionDto.RuleRequest;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RuleRepository ruleRepository;
    private final MatchService matchService;

    @Transactional
    public SessionDto.SessionResponse createSession(Long hostUserId, SessionDto.CreateRequest request) {
        User host = userRepository.findById(hostUserId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        Session saved = sessionRepository.save(buildSession(request, host));

        // 규칙 저장
        if (request.rules() != null) {
            request.rules().forEach(ruleReq -> {
                ruleRepository.save(buildRule(ruleReq, saved));
            });
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

    public List<SessionDto.SessionResponse> getMySessions(Long userId) {
        return sessionRepository.findSessionsByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MatchDto.ScreenshotUploadResponse uploadMatchImage(Long sessionId, MultipartFile file) {
        Session session = getSessionOrThrow(sessionId);
        return matchService.uploadScreenshot(session, file);
    }

    private Session getSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
    }

    private SessionDto.SessionResponse toResponse(Session session) {
        return new SessionDto.SessionResponse(
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
