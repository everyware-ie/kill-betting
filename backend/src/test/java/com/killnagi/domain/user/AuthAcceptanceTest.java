package com.killnagi.domain.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.killnagi.support.AcceptanceTestSupport;

@DisplayName("Auth 인수 테스트")
class AuthAcceptanceTest extends AcceptanceTestSupport {

    @Test
    void 이메일과_비밀번호로_회원가입하면_토큰을_발급받는다() {
        // Given
        String signUpBody = toJson(Map.of(
                "nickname", "tester",
                "email", "test@test.com",
                "password", "password1!"));

        // When
        ResponseEntity<String> response = post("/api/auth/signup", signUpBody);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(parseBody(response).at("/data/accessToken").asText()).isNotBlank();
    }

    @Test
    void 이미_사용_중인_이메일로_가입하면_실패한다() {
        // Given
        String email = "dup@test.com";
        post("/api/auth/signup", toJson(Map.of("nickname", "first", "email", email, "password", "password1!")));

        // When
        ResponseEntity<String> response = post("/api/auth/signup",
                toJson(Map.of("nickname", "second", "email", email, "password", "password1!")));

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void 가입한_이메일과_비밀번호로_로그인하면_토큰을_발급받는다() {
        // Given
        post("/api/auth/signup", toJson(Map.of(
                "nickname", "tester",
                "email", "login@test.com",
                "password", "password1!")));

        // When
        ResponseEntity<String> response = post("/api/auth/login",
                toJson(Map.of("email", "login@test.com", "password", "password1!")));

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/accessToken").asText()).isNotBlank();
    }

    @Test
    void 발급받은_토큰으로_내_정보를_조회할_수_있다() {
        // Given
        String token = 회원가입하고_토큰을_반환한다("tester", "me@test.com");

        // When
        ResponseEntity<String> response = get("/api/auth/me", token);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/nickname").asText()).isEqualTo("tester");
    }
}
