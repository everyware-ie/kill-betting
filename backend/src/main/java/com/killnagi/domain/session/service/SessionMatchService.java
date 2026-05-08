package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchStatus;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.match.service.MatchService;
import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.MatchSummaryResponse;
import com.killnagi.domain.session.dto.response.MemberMatchResultResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.session.dto.response.TeamScoreResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionMatchService {

    private final SessionRepository sessionRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final MatchService matchService;

    public ScoreboardResponse getScoreboard(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<TeamScoreResponse> teamScores = teamRepository.findBySessionId(sessionId).stream()
                .map(TeamScoreResponse::from)
                .toList();
        return new ScoreboardResponse(session.getId(), session.getName(), session.getStatus(), teamScores);
    }

    public MatchHistoryResponse getMatchHistory(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        List<Match> matches = matchRepository.findBySessionIdAndStatusOrderByMatchNumberAsc(sessionId, MatchStatus.CONFIRMED);
        Map<Long, List<MemberMatchResultResponse>> resultsByMatchId = groupResultsByMatchId(matches);
        List<MatchSummaryResponse> summaries = toMatchSummaries(matches, resultsByMatchId);
        return new MatchHistoryResponse(session.getId(), session.getName(), matches.size(), summaries);
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
}