package com.killnagi.domain.team.service;

import com.killnagi.domain.session.dto.response.SessionMessage;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.infra.redis.RedisMessagePublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeamConfigureBroadcaster {

    private final RedisMessagePublisher messagePublisher;

    public void broadcast(Long sessionId, ConfigureStateMessage message) {
        messagePublisher.publish(
                "/topic/sessions/" + sessionId,
                new SessionMessage(SessionMessage.Type.PARTICIPANT_UPDATED, message)
        );
    }
}
