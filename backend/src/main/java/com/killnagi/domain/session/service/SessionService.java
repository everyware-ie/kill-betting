package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchStatus;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.match.service.MatchService;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.request.CreateRequest;
import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.MatchSummaryResponse;
import com.killnagi.domain.session.dto.response.MemberMatchResultResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.dto.response.TeamScoreResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionService {

    private static final int MIN_TEAMS_TO_START = 2;
    private static final String ROOM_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int ROOM_CODE_LENGTH = 6;

    private final SessionRepository sessionRepository;
    private final SessionUserRepository sessionUserRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RuleRepository ruleRepository;
    private final RuleSetRepository ruleSetRepository;
    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final MatchService matchService;
    private final SessionParticipantRegistry registry;
    private final SessionTimerService sessionTimerService;

    @Transactional
    public SessionResponse createSession(Long hostUserId, CreateRequest request) {
        User host = userRepository.findById(hostUserId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        Session session = sessionRepository.save(Session.builder()
                .name(request.name())
                .roomUrl(generateUniqueRoomUrl())
                .roomCode(generateUniqueRoomCode())
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
        if (teams.size() < MIN_TEAMS_TO_START) {
            throw KillnagiException.badRequest("최소 " + MIN_TEAMS_TO_START + "팀이 필요합니다.");
        }

        // 대기실 참여자를 SessionUser로 일괄 저장
        userRepository.findAllById(registry.getParticipantIds(sessionId)).forEach(participant ->
                sessionUserRepository.save(SessionUser.builder()
                        .session(session)
                        .user(participant)
                        .build()));

        session.start();

        if (session.hasTimeLimit()) {
            sessionTimerService.scheduleExpiry(session.getId(), session.getExpiresAt());
        }
    }

    @Transactional
    public void updateRule(Long sessionId, Long ruleId, int newValue, Long userId) {
        Session session = getSessionOrThrow(sessionId);
        if (!session.isHostedBy(userId)) {
            throw KillnagiException.forbidden("세션 호스트만 룰을 수정할 수 있습니다.");
        }

        Rule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> KillnagiException.notFound("룰을 찾을 수 없습니다."));

        if (!rule.getRuleSet().getSession().getId().equals(sessionId)) {
            throw KillnagiException.badRequest("이 세션의 룰이 아닙니다.");
        }

        rule.updateValue(newValue);
    }

    public ScoreboardResponse getScoreboard(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<TeamScoreResponse> teamScores = teamRepository.findBySessionId(sessionId).stream()
                .map(TeamScoreResponse::from)
                .toList();
        return new ScoreboardResponse(
                session.getId(), session.getName(), session.getStatus(),
                session.getWinnerTeamId(), session.getWinnerTeamName(), session.isDraw(),
                teamScores);
    }

    public SessionResponse getSessionByRoomUrl(String roomUrl) {
        Session session = sessionRepository.findByRoomUrl(roomUrl)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
        return toResponse(session);
    }

    public List<SessionResponse> getWaitingSessions() {
        return sessionRepository.findByStatus(Session.SessionStatus.WAITING).stream()
                .map(this::toResponse)
                .toList();
    }

    public SessionResponse getSessionByRoomCode(String roomCode) {
        Session session = sessionRepository.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> KillnagiException.notFound("방 코드에 해당하는 세션을 찾을 수 없습니다."));
        return toResponse(session);
    }

    public MatchHistoryResponse getMatchHistory(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<Match> matches = matchRepository.findBySessionIdAndStatusOrderByMatchNumberAsc(sessionId, MatchStatus.CONFIRMED);
        Map<Long, List<MemberMatchResultResponse>> resultsByMatchId = groupResultsByMatchId(matches);
        List<MatchSummaryResponse> summaries = toMatchSummaries(matches, resultsByMatchId);
        return new MatchHistoryResponse(session.getId(), session.getName(), matches.size(), summaries);
    }

    private Map<Long, List<MemberMatchResultResponse>> groupResultsByMatchId(List<Match> matches) {
        return matchResultRepository.findByMatchIn(matches).stream()
                .collect(Collectors.groupingBy(
                        result -> result.getMatch().getId(),
                        Collectors.mapping(MemberMatchResultResponse::from, Collectors.toList())
                ));
    }

    private List<MatchSummaryResponse> toMatchSummaries(List<Match> matches, Map<Long, List<MemberMatchResultResponse>> resultsByMatchId) {
        return matches.stream()
                .map(match -> MatchSummaryResponse.from(match, resultsByMatchId.getOrDefault(match.getId(), List.of())))
                .toList();
    }

    public List<SessionResponse> getMySessions(Long userId) {
        return sessionRepository.findSessionsByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ScreenshotUploadResponse uploadMatchImage(Long sessionId, Long uploaderId, MultipartFile file) {
        Session session = getSessionOrThrow(sessionId);
        Team team = teamRepository.findBySessionIdAndLeader_Id(sessionId, uploaderId)
                .orElseThrow(() -> KillnagiException.notFound("해당 세션에서 Leader로 배정된 팀을 찾을 수 없습니다."));
        return matchService.uploadScreenshot(session, team, file);
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
                session.getRoomUrl(),
                session.getRoomCode(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt()
        );
    }

    private String generateUniqueRoomUrl() {
        String roomUrl;
        do {
            roomUrl = UUID.randomUUID().toString();
        } while (sessionRepository.existsByRoomUrl(roomUrl));
        return roomUrl;
    }

    private String generateUniqueRoomCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(ROOM_CODE_LENGTH);
            for (int i = 0; i < ROOM_CODE_LENGTH; i++) {
                sb.append(ROOM_CODE_CHARS.charAt(ThreadLocalRandom.current().nextInt(ROOM_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (sessionRepository.existsByRoomCode(code));
        return code;
    }
}
