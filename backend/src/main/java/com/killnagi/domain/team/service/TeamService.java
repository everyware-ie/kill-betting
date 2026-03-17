package com.killnagi.domain.team.service;

import com.killnagi.common.exception.KillnagiException;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public record CreateTeamRequest(String name) {}
    public record AddMemberRequest(Long userId) {}

    public record TeamResponse(Long id, String name, int effectiveKills, List<String> memberNicknames) {}

    @Transactional
    public TeamResponse createTeam(Long sessionId, Long hostUserId, CreateTeamRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        if (!session.getHost().getId().equals(hostUserId)) {
            throw KillnagiException.forbidden("세션 호스트만 팀을 생성할 수 있습니다.");
        }
        if (session.getStatus() != Session.SessionStatus.WAITING) {
            throw KillnagiException.badRequest("대기 중인 세션에서만 팀을 생성할 수 있습니다.");
        }

        Team team = Team.builder()
                .session(session)
                .name(request.name())
                .build();

        Team saved = teamRepository.save(team);
        return toResponse(saved);
    }

    @Transactional
    public TeamResponse addMember(Long sessionId, Long teamId, AddMemberRequest request) {
        Team team = teamRepository.findByIdAndSessionId(teamId, sessionId)
                .orElseThrow(() -> KillnagiException.notFound("팀을 찾을 수 없습니다."));

        if (team.getMembers().size() >= 4) {
            throw KillnagiException.badRequest("팀은 최대 4명까지 구성할 수 있습니다.");
        }

        if (teamMemberRepository.existsByTeam_Session_IdAndUserId(sessionId, request.userId())) {
            throw KillnagiException.badRequest("이미 세션에 참여 중인 사용자입니다.");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(user)
                .build();
        teamMemberRepository.save(member);

        return toResponse(teamRepository.findById(teamId).get());
    }

    public List<TeamResponse> getTeams(Long sessionId) {
        return teamRepository.findBySessionId(sessionId).stream()
                .map(this::toResponse)
                .toList();
    }

    private TeamResponse toResponse(Team team) {
        List<String> nicknames = team.getMembers().stream()
                .map(m -> m.getUser().getNickname())
                .toList();
        return new TeamResponse(team.getId(), team.getName(), team.getEffectiveKills(), nicknames);
    }
}
