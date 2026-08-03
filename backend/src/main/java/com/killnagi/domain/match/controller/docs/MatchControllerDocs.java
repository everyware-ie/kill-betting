package com.killnagi.domain.match.controller.docs;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.request.ConfirmRequest;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

@Tag(name = "Match", description = "매치 관리 API")
public interface MatchControllerDocs {

    @Operation(summary = "매치 결과 확정", description = "업로드된 매치 결과를 확정합니다. 업로더 권한이 필요합니다.")
    ResponseEntity<ApiResponse<ConfirmResponse>> confirm(Long matchId, UserDetails userDetails, ConfirmRequest request);

    @Operation(summary = "확정 매치 삭제", description = "확정된 매치를 삭제하고 팀 점수를 되돌립니다. 해당 매치가 속한 팀의 리더만 가능하며, 진행 중인 세션에서만 허용됩니다.")
    ResponseEntity<Void> delete(Long matchId, UserDetails userDetails);
}