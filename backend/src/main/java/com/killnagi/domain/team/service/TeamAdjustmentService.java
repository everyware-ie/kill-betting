package com.killnagi.domain.team.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.event.AdjustmentAppliedEvent;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TeamAdjustmentService {

    private final SessionRepository sessionRepository;
    private final TeamRepository teamRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void applyAdjustment(Long sessionId, Long teamId, Long hostUserId, int amount, String reason) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        if (!session.isHostedBy(hostUserId)) {
            throw KillnagiException.forbidden("세션 호스트만 점수를 조정할 수 있습니다.");
        }

        if (!session.isInProgress()) {
            throw KillnagiException.badRequest("진행 중인 세션에서만 점수를 조정할 수 있습니다.");
        }

        Team team = teamRepository.findByIdAndSessionId(teamId, sessionId)
                .orElseThrow(() -> KillnagiException.notFound("팀을 찾을 수 없습니다."));

        team.applyAdjustment(amount);
        eventPublisher.publishEvent(new AdjustmentAppliedEvent(sessionId, teamId, team.getName(), amount, reason));
    }
}
