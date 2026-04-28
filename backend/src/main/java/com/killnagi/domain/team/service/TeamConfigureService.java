package com.killnagi.domain.team.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.service.SessionUserService;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage.PlayerInfo;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage.TeamConfigureInfo;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage.WaitingUserInfo;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamConfigureService {

    private static final int MAX_PLAYERS_PER_TEAM = 4;

    private final SessionRepository sessionRepository;
    private final TeamRepository teamRepository;
    private final TeamPlayerRepository teamPlayerRepository;
    private final UserRepository userRepository;
    private final SessionUserService sessionUserService;

    @Transactional
    public void addPlayer(Long sessionId, Long teamId, Long hostUserId, String playerNickname) {
        Session session = findWaitingSession(sessionId);
        validateHost(session, hostUserId);

        Team team = findTeamInSession(teamId, sessionId);

        if (teamPlayerRepository.countByTeam_Id(teamId) >= MAX_PLAYERS_PER_TEAM) {
            throw KillnagiException.badRequest("팀에 최대 " + MAX_PLAYERS_PER_TEAM + "명까지 추가할 수 있습니다.");
        }

        if (teamPlayerRepository.existsByTeam_IdAndPlayerNickname(teamId, playerNickname)) {
            throw KillnagiException.badRequest("이미 등록된 닉네임입니다.");
        }

        teamPlayerRepository.save(TeamPlayer.builder()
                .team(team)
                .playerNickname(playerNickname)
                .build());
    }

    @Transactional
    public void updatePlayer(Long sessionId, Long teamId, Long playerId, Long hostUserId, String playerNickname) {
        Session session = findWaitingSession(sessionId);
        validateHost(session, hostUserId);

        findTeamInSession(teamId, sessionId);

        TeamPlayer player = teamPlayerRepository.findById(playerId)
                .filter(p -> p.getTeamId().equals(teamId))
                .orElseThrow(() -> KillnagiException.notFound("팀원을 찾을 수 없습니다."));

        if (teamPlayerRepository.existsByTeam_IdAndPlayerNickname(teamId, playerNickname)) {
            throw KillnagiException.badRequest("이미 등록된 닉네임입니다.");
        }

        player.updateNickname(playerNickname);
    }

    @Transactional
    public void removePlayer(Long sessionId, Long teamId, Long playerId, Long hostUserId) {
        Session session = findWaitingSession(sessionId);
        validateHost(session, hostUserId);

        findTeamInSession(teamId, sessionId);

        TeamPlayer player = teamPlayerRepository.findById(playerId)
                .filter(p -> p.getTeamId().equals(teamId))
                .orElseThrow(() -> KillnagiException.notFound("팀원을 찾을 수 없습니다."));

        teamPlayerRepository.delete(player);
    }

    @Transactional
    public void assignOperator(Long sessionId, Long teamId, Long hostUserId, Long targetUserId) {
        Session session = findWaitingSession(sessionId);
        validateHost(session, hostUserId);

        Team team = findTeamInSession(teamId, sessionId);

        // 대기석에 있는 사용자인지 확인 (Host 본인 배정은 예외)
        if (!session.isHostedBy(targetUserId)) {
            boolean isInWaiting = sessionUserService.getActiveUsers(sessionId).stream()
                    .anyMatch(su -> su.getUserId().equals(targetUserId));
            if (!isInWaiting) {
                throw KillnagiException.badRequest("대기석에 있는 사용자만 Operator로 배정할 수 있습니다.");
            }
        }

        // 다른 팀에 이미 Operator로 배정된 경우
        if (teamRepository.existsBySessionIdAndOperatorUserIdAndIdNot(sessionId, targetUserId, teamId)) {
            throw KillnagiException.badRequest("이미 다른 팀의 Operator로 배정된 사용자입니다.");
        }

        team.assignOperator(targetUserId);
    }

    public ConfigureStateMessage buildConfigureState(Long sessionId) {
        List<SessionUser> activeUsers = sessionUserService.getActiveUsers(sessionId);
        List<Team> teams = teamRepository.findBySessionId(sessionId);

        // Operator로 배정된 userId 집합
        List<Long> assignedOperatorIds = teams.stream()
                .filter(Team::hasOperator)
                .map(Team::getOperatorUserId)
                .toList();

        // 대기 중인 사용자 = ACTIVE 중 Operator 아닌 사람 (Host도 대기석에 없으므로 자동 제외)
        List<WaitingUserInfo> waitingUsers = activeUsers.stream()
                .filter(su -> !assignedOperatorIds.contains(su.getUserId()))
                .map(su -> new WaitingUserInfo(su.getUserId(), su.getUserNickname()))
                .toList();

        // Operator 닉네임 조회를 위해 userId → User 맵 구성
        List<Long> operatorIds = assignedOperatorIds;
        Map<Long, String> operatorNicknameMap = userRepository.findAllById(operatorIds).stream()
                .collect(Collectors.toMap(User::getId, User::getNickname));

        List<TeamConfigureInfo> teamInfos = teams.stream()
                .map(team -> {
                    List<PlayerInfo> players = team.getPlayers().stream()
                            .map(p -> new PlayerInfo(p.getId(), p.getPlayerNickname()))
                            .toList();

                    String operatorNickname = team.getOperatorUserId() != null
                            ? operatorNicknameMap.get(team.getOperatorUserId())
                            : null;

                    String status = resolveTeamStatus(team, players);

                    return new TeamConfigureInfo(
                            team.getId(), team.getName(), status,
                            team.getOperatorUserId(), operatorNickname,
                            players
                    );
                })
                .toList();

        return new ConfigureStateMessage(sessionId, waitingUsers, teamInfos);
    }

    private String resolveTeamStatus(Team team, List<PlayerInfo> players) {
        boolean hasOperator = team.hasOperator();
        boolean hasPlayers = !players.isEmpty();

        if (hasOperator && hasPlayers) return "READY";
        if (hasOperator || hasPlayers) return "PARTIAL";
        return "EMPTY";
    }

    private Session findWaitingSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        if (!session.isWaiting()) {
            throw KillnagiException.badRequest("대기 중인 세션에서만 팀을 구성할 수 있습니다.");
        }
        return session;
    }

    private void validateHost(Session session, Long userId) {
        if (!session.isHostedBy(userId)) {
            throw KillnagiException.forbidden("호스트만 팀을 구성할 수 있습니다.");
        }
    }

    private Team findTeamInSession(Long teamId, Long sessionId) {
        return teamRepository.findByIdAndSessionId(teamId, sessionId)
                .orElseThrow(() -> KillnagiException.notFound("팀을 찾을 수 없습니다."));
    }
}
