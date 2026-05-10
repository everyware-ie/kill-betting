package com.killnagi.domain.team.controller;

import com.killnagi.domain.team.dto.request.AddPlayerRequest;
import com.killnagi.domain.team.dto.request.AssignLeaderRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.request.UpdatePlayerRequest;
import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.service.TeamConfigureBroadcaster;
import com.killnagi.domain.team.service.TeamConfigureService;
import com.killnagi.domain.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class TeamMessageController {

    private final TeamService teamService;
    private final TeamConfigureService teamConfigureService;
    private final TeamConfigureBroadcaster configureBroadcaster;

    @MessageMapping("/sessions/{sessionId}/teams/create")
    public void createTeam(@DestinationVariable Long sessionId,
                           Principal principal,
                           CreateTeamRequest request) {
        Long userId = parseUserId(principal);
        teamService.createTeam(sessionId, userId, request);
        broadcastConfigureState(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/players/add")
    public void addPlayer(@DestinationVariable Long sessionId,
                          @DestinationVariable Long teamId,
                          Principal principal,
                          AddPlayerRequest request) {
        Long userId = parseUserId(principal);
        teamConfigureService.addPlayer(sessionId, teamId, userId, request.playerNickname());
        broadcastConfigureState(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/players/{playerId}/update")
    public void updatePlayer(@DestinationVariable Long sessionId,
                             @DestinationVariable Long teamId,
                             @DestinationVariable Long playerId,
                             Principal principal,
                             UpdatePlayerRequest request) {
        Long userId = parseUserId(principal);
        teamConfigureService.updatePlayer(sessionId, teamId, playerId, userId, request.playerNickname());
        broadcastConfigureState(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/players/{playerId}/remove")
    public void removePlayer(@DestinationVariable Long sessionId,
                             @DestinationVariable Long teamId,
                             @DestinationVariable Long playerId,
                             Principal principal) {
        Long userId = parseUserId(principal);
        teamConfigureService.removePlayer(sessionId, teamId, playerId, userId);
        broadcastConfigureState(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/leader")
    public void assignLeader(@DestinationVariable Long sessionId,
                             @DestinationVariable Long teamId,
                             Principal principal,
                             AssignLeaderRequest request) {
        Long userId = parseUserId(principal);
        teamConfigureService.assignLeader(sessionId, teamId, userId, request.userId());
        broadcastConfigureState(sessionId);
    }

    @MessageMapping("/sessions/{sessionId}/teams/{teamId}/leader/remove")
    public void unassignLeader(@DestinationVariable Long sessionId,
                               @DestinationVariable Long teamId,
                               Principal principal) {
        Long userId = parseUserId(principal);
        teamConfigureService.unassignLeader(sessionId, teamId, userId);
        broadcastConfigureState(sessionId);
    }

    private Long parseUserId(Principal principal) {
        return Long.parseLong(principal.getName());
    }

    private void broadcastConfigureState(Long sessionId) {
        ConfigureStateMessage state = teamConfigureService.buildConfigureState(sessionId);
        configureBroadcaster.broadcast(sessionId, state);
    }
}