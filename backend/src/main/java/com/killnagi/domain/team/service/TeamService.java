package com.killnagi.domain.team.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.response.TeamResponse;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public TeamResponse createTeam(Long sessionId, Long hostUserId, CreateTeamRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        if (!session.isHostedBy(hostUserId)) {
            throw KillnagiException.forbidden("세션 호스트만 팀을 생성할 수 있습니다.");
        }

        if (!session.isWaiting()) {
            throw KillnagiException.badRequest("대기 중인 세션에서만 팀을 생성할 수 있습니다.");
        }

        Team newTeam = teamRepository.save(Team.builder()
                .session(session)
                .name(request.name())
                .build());
        return toResponse(newTeam);
    }

    public List<TeamResponse> getTeams(Long sessionId) {
        return teamRepository.findBySessionId(sessionId).stream()
                .map(this::toResponse)
                .toList();
    }

    private TeamResponse toResponse(Team team) {
        List<String> players = team.getPlayers().stream()
                .map(TeamPlayer::getPlayerNickname)
                .toList();

        List<TeamResponse.MemberResponse> members = team.hasLeader()
                ? List.of(new TeamResponse.MemberResponse(
                        team.getLeaderUserId(),
                        team.getLeaderNickname(),
                        "LEADER"))
                : List.of();

        return new TeamResponse(team.getId(), team.getName(), team.getLeaderUserId(), team.getEffectiveKills(), members, players);
    }
}
