package com.killnagi.domain.team.service;

import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeamConfigureBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcast(Long sessionId, ConfigureStateMessage message) {
        messagingTemplate.convertAndSend(
                "/topic/sessions/" + sessionId + "/configure",
                message
        );
    }
}
