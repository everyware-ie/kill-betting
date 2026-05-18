package com.killnagi.domain.team.controller;

import com.killnagi.domain.team.dto.request.AddPlayerRequest;
import com.killnagi.domain.team.dto.request.AssignLeaderRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.request.UpdatePlayerRequest;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.service.TeamConfigureService;
import com.killnagi.domain.team.service.TeamService;
import com.killnagi.domain.session.dto.response.SessionMessage;
import com.killnagi.domain.session.dto.response.SessionMessage.Type;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class TeamMessageController {

    private final TeamService teamService;
    private final TeamConfigureService teamConfigureService;

    @MessageMapping("/sessions/{sessionId}/teams/create")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage createTeam(@DestinationVariable Long sessionId,
                                     Principal principal,
                                     CreateTeamRequest request) {
        Long userId = parseUserId(principal);
        teamService.createTeam(sessionId, userId, request);
        return buildResponse(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/players/add")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage addPlayer(@DestinationVariable Long sessionId,
                                    @DestinationVariable Long teamId,
                                    Principal principal,
                                    AddPlayerRequest request) {
        Long userId = parseUserId(principal);
        teamConfigureService.addPlayer(sessionId, teamId, userId, request.playerNickname());
        return buildResponse(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/players/{playerId}/update")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage updatePlayer(@DestinationVariable Long sessionId,
                                       @DestinationVariable Long teamId,
                                       @DestinationVariable Long playerId,
                                       Principal principal,
                                       UpdatePlayerRequest request) {
        Long userId = parseUserId(principal);
        teamConfigureService.updatePlayer(sessionId, teamId, playerId, userId, request.playerNickname());
        return buildResponse(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/players/{playerId}/remove")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage removePlayer(@DestinationVariable Long sessionId,
                                       @DestinationVariable Long teamId,
                                       @DestinationVariable Long playerId,
                                       Principal principal) {
        Long userId = parseUserId(principal);
        teamConfigureService.removePlayer(sessionId, teamId, playerId, userId);
        return buildResponse(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/delete")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage deleteTeam(@DestinationVariable Long sessionId,
                                     @DestinationVariable Long teamId,
                                     Principal principal) {
        Long userId = parseUserId(principal);
        teamService.deleteTeam(sessionId, teamId, userId);
        return buildResponse(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/leader")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage assignLeader(@DestinationVariable Long sessionId,
                                       @DestinationVariable Long teamId,
                                       Principal principal,
                                       AssignLeaderRequest request) {
        Long userId = parseUserId(principal);
        teamConfigureService.assignLeader(sessionId, teamId, userId, request.userId());
        return buildResponse(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/leader/remove")
    @SendTo("/topic/sessions/{sessionId}")
    public SessionMessage unassignLeader(@DestinationVariable Long sessionId,
                                         @DestinationVariable Long teamId,
                                         Principal principal) {
        Long userId = parseUserId(principal);
        teamConfigureService.unassignLeader(sessionId, teamId, userId);
        return buildResponse(sessionId);
    }

    private Long parseUserId(Principal principal) {
        return Long.parseLong(principal.getName());
    }

    private SessionMessage buildResponse(Long sessionId) {
        ConfigureStateMessage state = teamConfigureService.buildConfigureState(sessionId);
        return new SessionMessage(Type.PARTICIPANT_UPDATED, state);
    }
}
