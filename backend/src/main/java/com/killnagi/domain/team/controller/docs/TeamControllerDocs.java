package com.killnagi.domain.team.controller.docs;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.request.AddPlayerRequest;
import com.killnagi.domain.team.dto.request.AssignLeaderRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
import com.killnagi.domain.team.dto.request.UpdatePlayerRequest;
import com.killnagi.domain.team.dto.response.TeamResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

@Tag(name = "Team", description = "팀 관리 API")
public interface TeamControllerDocs {

    @Operation(summary = "팀 생성", description = "세션 내에 새로운 팀을 생성합니다.")
    ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            UserDetails userDetails,
            Long sessionId,
            CreateTeamRequest request);

    @Operation(summary = "팀 목록 조회", description = "세션의 전체 팀 목록을 조회합니다.")
    ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(Long sessionId);

    @Operation(summary = "플레이어 닉네임 추가", description = "팀에 PUBG 닉네임 슬롯을 추가합니다. (Host 전용)")
    ResponseEntity<ApiResponse<Void>> addPlayer(
            UserDetails userDetails,
            Long sessionId,
            Long teamId,
            AddPlayerRequest request);

    @Operation(summary = "플레이어 닉네임 수정", description = "팀의 PUBG 닉네임 슬롯을 수정합니다. (Host 전용)")
    ResponseEntity<ApiResponse<Void>> updatePlayer(
            UserDetails userDetails,
            Long sessionId,
            Long teamId,
            Long playerId,
            UpdatePlayerRequest request);

    @Operation(summary = "플레이어 제거", description = "팀의 PUBG 닉네임 슬롯을 제거합니다. (Host 전용)")
    ResponseEntity<ApiResponse<Void>> removePlayer(
            UserDetails userDetails,
            Long sessionId,
            Long teamId,
            Long playerId);

    @Operation(summary = "Leader 배정", description = "대기석 사용자를 팀의 Leader로 배정합니다. (Host 전용)")
    ResponseEntity<ApiResponse<Void>> assignLeader(
            UserDetails userDetails,
            Long sessionId,
            Long teamId,
            AssignLeaderRequest request);
}
