package com.killnagi.domain.user.controller.docs;

import com.killnagi.common.response.ApiResponse;
import com.killnagi.domain.user.dto.request.LoginRequest;
import com.killnagi.domain.user.dto.request.SignUpRequest;
import com.killnagi.domain.user.dto.response.TokenResponse;
import com.killnagi.domain.user.dto.response.UserInfoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

@Tag(name = "Auth", description = "인증 API")
public interface AuthControllerDocs {

    @Operation(summary = "회원가입", description = "이메일과 비밀번호로 회원가입합니다.")
    ResponseEntity<ApiResponse<TokenResponse>> signUp(SignUpRequest request);

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.")
    ResponseEntity<ApiResponse<TokenResponse>> login(LoginRequest request);

    @Operation(summary = "내 정보 조회", description = "로그인한 사용자의 정보를 조회합니다.")
    ResponseEntity<ApiResponse<UserInfoResponse>> getMyInfo(UserDetails userDetails);
}