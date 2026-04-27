package com.killnagi.domain.team.controller.docs;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.team.dto.request.AddMemberRequest;
import com.killnagi.domain.team.dto.request.CreateTeamRequest;
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

    @Operation(summary = "팀 멤버 추가", description = "팀에 멤버를 추가합니다.")
    ResponseEntity<ApiResponse<TeamResponse>> addMember(
            Long sessionId,
            Long teamId,
            AddMemberRequest request);

    @Operation(summary = "팀 목록 조회", description = "세션의 전체 팀 목록을 조회합니다.")
    ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(Long sessionId);
}