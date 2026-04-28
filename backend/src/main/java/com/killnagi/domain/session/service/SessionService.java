package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.entity.MatchStatus;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.service.MatchService;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.request.CreateRequest;
import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.MatchSummaryResponse;
import com.killnagi.domain.session.dto.response.MemberMatchResultResponse;
import com.killnagi.domain.session.dto.response.MemberScoreResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.dto.response.TeamScoreResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.team.repository.TeamMemberRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionService {

    private static final int MIN_TEAMS_TO_START = 2;

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final RuleRepository ruleRepository;
    private final RuleSetRepository ruleSetRepository;
    private final MatchRepository matchRepository;
    private final MatchService matchService;

    @Transactional
    public SessionResponse createSession(Long hostUserId, CreateRequest request) {
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
        if (teams.size() < MIN_TEAMS_TO_START) {
            throw KillnagiException.badRequest("최소 " + MIN_TEAMS_TO_START + "팀이 필요합니다.");
        }
        session.start();
    }

    public ScoreboardResponse getScoreboard(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<TeamScoreResponse> teamScores = teamRepository.findBySessionId(sessionId).stream()
                .map(this::toTeamScoreResponse)
                .toList();
        return new ScoreboardResponse(session.getId(), session.getName(), session.getStatus(), teamScores);
    }

    public SessionResponse getSessionByRoomUrl(String roomUrl) {
        Session session = sessionRepository.findByRoomUrl(roomUrl)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
        return toResponse(session);
    }

    public MatchHistoryResponse getMatchHistory(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<Match> matches = matchRepository.findConfirmedMatchesWithResults(sessionId, MatchStatus.CONFIRMED);
        List<MatchSummaryResponse> summaries = matches.stream()
                .map(this::toMatchSummaryResponse)
                .toList();
        return new MatchHistoryResponse(session.getId(), session.getName(), matches.size(), summaries);
    }

    public List<SessionResponse> getMySessions(Long userId) {
        return sessionRepository.findSessionsByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ScreenshotUploadResponse uploadMatchImage(Long sessionId, Long uploaderId, MultipartFile file) {
        Session session = getSessionOrThrow(sessionId);
        Team team = teamMemberRepository.findByTeam_SessionIdAndUser_Id(sessionId, uploaderId)
                .orElseThrow(() -> KillnagiException.notFound("해당 세션에 속한 팀을 찾을 수 없습니다."))
                .getTeam();
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
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt()
        );
    }

    private TeamScoreResponse toTeamScoreResponse(Team team) {
        List<MemberScoreResponse> members = team.getMembers().stream()
                .map(this::toMemberScoreResponse)
                .toList();
        return new TeamScoreResponse(
                team.getId(), team.getName(),
                team.getTotalKills(), team.getBonusKills(), team.getPenaltyKills(), team.getEffectiveKills(),
                members
        );
    }

    private MemberScoreResponse toMemberScoreResponse(TeamMember member) {
        return new MemberScoreResponse(
                member.getUserId(), member.getUserNickname(),
                member.getTotalKills(), member.getBonusKills(), member.getPenaltyKills(), member.getEffectiveKills()
        );
    }

    private MatchSummaryResponse toMatchSummaryResponse(Match match) {
        List<MemberMatchResultResponse> memberResults = match.getResults().stream()
                .map(this::toMemberMatchResultResponse)
                .toList();
        return new MatchSummaryResponse(
                match.getId(), match.getMatchNumber(), match.getMapName(), match.getCreatedAt(), memberResults
        );
    }

    private MemberMatchResultResponse toMemberMatchResultResponse(MatchResult result) {
        TeamMember member = result.getTeamMember();
        return new MemberMatchResultResponse(
                member.getUserId(), member.getTeamId(), member.getTeamName(), member.getUserNickname(),
                result.getKills(), result.getBonusKills(), result.getPenaltyKills(), result.getEffectiveKills(),
                result.getPlacement(), result.isChicken()
        );
    }

    private String generateUniqueRoomUrl() {
        String roomUrl;
        do {
            roomUrl = UUID.randomUUID().toString();
        } while (sessionRepository.existsByRoomUrl(roomUrl));
        return roomUrl;
    }
}
