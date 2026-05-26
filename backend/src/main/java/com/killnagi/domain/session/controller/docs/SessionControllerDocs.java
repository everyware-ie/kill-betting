package com.killnagi.domain.session.controller.docs;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.session.dto.request.CreateRequest;
import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.session.dto.response.MySessionResponse;
import com.killnagi.domain.session.dto.response.SessionDetailResponse;
import com.killnagi.domain.session.dto.response.SessionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Session", description = "세션 관리 API")
public interface SessionControllerDocs {

    @Operation(summary = "세션 목록 조회", description = "대기 중인 세션 목록을 조회합니다. code 파라미터로 방 코드 검색 가능.")
    ResponseEntity<ApiResponse<List<SessionResponse>>> getSessions(String code);

    @Operation(summary = "세션 생성", description = "새로운 킬내기 세션을 생성합니다.")
    ResponseEntity<ApiResponse<SessionResponse>> createSession(
            UserDetails userDetails,
            @Valid CreateRequest request);

    @Operation(summary = "세션 상세 조회", description = "방 코드로 세션 상세 정보를 조회합니다.")
    ResponseEntity<ApiResponse<SessionDetailResponse>> getSessionByRoomCode(String roomCode);

    @Operation(summary = "세션 시작", description = "세션을 시작 상태로 변경합니다. 호스트만 가능합니다.")
    ResponseEntity<ApiResponse<Void>> startSession(UserDetails userDetails, Long sessionId);

    @Operation(summary = "스코어보드 조회", description = "세션의 실시간 팀별 점수를 조회합니다.")
    ResponseEntity<ApiResponse<ScoreboardResponse>> getScoreboard(Long sessionId);

    @Operation(summary = "매치 이미지 업로드", description = "배그 결과 스크린샷을 업로드합니다. 업로더 권한이 필요합니다.")
    ResponseEntity<ApiResponse<ScreenshotUploadResponse>> uploadMatchImage(
            UserDetails userDetails,
            Long sessionId,
            MultipartFile file);

    @Operation(summary = "매치 히스토리 조회", description = "세션의 전체 매치 결과 기록을 조회합니다.")
    ResponseEntity<ApiResponse<MatchHistoryResponse>> getMatchHistory(Long sessionId);

    @Operation(summary = "내 세션 목록 조회", description = "로그인한 사용자가 참여한 세션 목록을 조회합니다.")
    ResponseEntity<ApiResponse<List<MySessionResponse>>> getMySessions(UserDetails userDetails);

    @Operation(summary = "세션 종료", description = "세션을 강제 종료합니다. 호스트만 가능합니다.")
    ResponseEntity<ApiResponse<Void>> endSession(UserDetails userDetails, Long sessionId);
}