package com.killnagi.domain.match;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.killnagi.infra.ocr.MatchOcrResult;
import com.killnagi.support.AcceptanceTestSupport;

@DisplayName("Match 인수 테스트")
class MatchAcceptanceTest extends AcceptanceTestSupport {

    @Test
    void 리더가_경기_스크린샷을_업로드하면_OCR_결과와_함께_매치가_등록된다() {
        // Given
        given(fileStorageService.store(any(), any())).willReturn("http://test-url/screenshots/test.jpg");
        given(ocrClient.parseMatchScreenshot(any(), any())).willReturn(MatchOcrResult.builder()
                .placement(5).mapName("에란겔").playTime("20:00").playerStats(List.of()).build());

        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);

        String leaderToken = 회원가입하고_토큰을_반환한다("leader", "leader@test.com");
        세션에_참가한다(sessionId, leaderToken);
        리더를_배정한다(sessionId, teamId, 사용자_ID를_조회한다(leaderToken), hostToken);

        // When
        long matchId = 매치_이미지를_업로드한다(sessionId, leaderToken);

        // Then
        assertThat(matchId).isPositive();
    }

    @Test
    void 리더가_매치_결과를_확정하면_해당_매치의_상태가_CONFIRMED가_된다() {
        // Given
        given(fileStorageService.store(any(), any())).willReturn("http://test-url/screenshots/test.jpg");
        given(ocrClient.parseMatchScreenshot(any(), any())).willReturn(MatchOcrResult.builder()
                .placement(5).mapName("에란겔").playTime("20:00").playerStats(List.of()).build());

        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);

        String leaderToken = 회원가입하고_토큰을_반환한다("leader", "leader@test.com");
        세션에_참가한다(sessionId, leaderToken);
        리더를_배정한다(sessionId, teamId, 사용자_ID를_조회한다(leaderToken), hostToken);

        long matchId = 매치_이미지를_업로드한다(sessionId, leaderToken);

        // When
        ResponseEntity<String> response = post("/api/matches/" + matchId + "/confirm",
                toJson(Map.of(
                        "playerResults", List.of(Map.of("nickname", "PlayerOne", "kills", 3, "placement", 5, "isTop10", true)),
                        "isChicken", false)),
                leaderToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/status").asText()).isEqualTo("CONFIRMED");
    }

    @Test
    void 확정된_매치는_히스토리_조회에서_팀_정보를_포함한다() {
        // Given
        given(fileStorageService.store(any(), any())).willReturn("http://test-url/screenshots/test.jpg");
        given(ocrClient.parseMatchScreenshot(any(), any())).willReturn(MatchOcrResult.builder()
                .placement(5).mapName("에란겔").playTime("20:00").playerStats(List.of()).build());

        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);

        String leaderToken = 회원가입하고_토큰을_반환한다("leader", "leader@test.com");
        세션에_참가한다(sessionId, leaderToken);
        리더를_배정한다(sessionId, teamId, 사용자_ID를_조회한다(leaderToken), hostToken);

        long matchId = 매치_이미지를_업로드한다(sessionId, leaderToken);
        post("/api/matches/" + matchId + "/confirm",
                toJson(Map.of(
                        "playerResults", List.of(Map.of("nickname", "PlayerOne", "kills", 3, "placement", 5, "isTop10", true)),
                        "isChicken", false)),
                leaderToken);

        // When
        ResponseEntity<String> response = get("/api/sessions/" + sessionId + "/match-history", hostToken);

        // Then
        JsonNode match = parseBody(response).at("/data/matches/0");
        assertThat(match.at("/teamId").asLong()).isEqualTo(teamId);
        assertThat(match.at("/teamName").asText()).isEqualTo("팀A");
    }

    @Test
    void 팀_리더가_확정된_매치를_삭제하면_팀_점수가_되돌아간다() {
        // Given
        given(fileStorageService.store(any(), any())).willReturn("http://test-url/screenshots/test.jpg");
        given(ocrClient.parseMatchScreenshot(any(), any())).willReturn(MatchOcrResult.builder()
                .placement(5).mapName("에란겔").playTime("20:00").playerStats(List.of()).build());

        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        long teamId = 팀을_생성한다(sessionId, "팀A", hostToken);
        플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);

        String leaderToken = 회원가입하고_토큰을_반환한다("leader", "leader@test.com");
        세션에_참가한다(sessionId, leaderToken);
        리더를_배정한다(sessionId, teamId, 사용자_ID를_조회한다(leaderToken), hostToken);
        기본_팀에_리더와_팀원을_배정한다(sessionId, hostToken);
        post("/api/sessions/" + sessionId + "/start", toJson(Map.of()), hostToken);

        long matchId = 매치_이미지를_업로드한다(sessionId, leaderToken);
        post("/api/matches/" + matchId + "/confirm",
                toJson(Map.of(
                        "playerResults", List.of(Map.of("nickname", "PlayerOne", "kills", 3, "placement", 5, "isTop10", true)),
                        "isChicken", false)),
                leaderToken);

        assertThat(팀의_유효킬을_조회한다(sessionId, teamId, hostToken)).isEqualTo(3);

        // When
        ResponseEntity<String> response = delete("/api/matches/" + matchId, leaderToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(팀의_유효킬을_조회한다(sessionId, teamId, hostToken)).isZero();
    }

    private int 팀의_유효킬을_조회한다(long sessionId, long teamId, String token) {
        JsonNode teams = parseBody(get("/api/sessions/" + sessionId + "/teams", token)).at("/data");
        for (JsonNode team : teams) {
            if (team.at("/id").asLong() == teamId) {
                return team.at("/effectiveKills").asInt();
            }
        }
        throw new AssertionError("팀을 찾을 수 없습니다: " + teamId);
    }

    // 세션 생성시 자동으로 만들어지는 기본 팀(ALPHA/BRAVO)에도 리더·팀원이 없으면 세션을 시작할 수 없다.
    private void 기본_팀에_리더와_팀원을_배정한다(long sessionId, String hostToken) {
        JsonNode teams = parseBody(get("/api/sessions/" + sessionId + "/teams", hostToken)).at("/data");
        int dummyIndex = 0;
        for (JsonNode team : teams) {
            if (team.at("/leaderUserId").isNull() || team.at("/leaderUserId").isMissingNode()) {
                long teamId = team.at("/id").asLong();
                String dummyToken = 회원가입하고_토큰을_반환한다("dummy" + dummyIndex, "dummy" + dummyIndex + "@test.com");
                세션에_참가한다(sessionId, dummyToken);
                리더를_배정한다(sessionId, teamId, 사용자_ID를_조회한다(dummyToken), hostToken);
                플레이어를_추가한다(sessionId, teamId, "DummyPlayer" + dummyIndex, hostToken);
                dummyIndex++;
            }
        }
    }

    @Test
    void 다른_팀_리더는_매치를_삭제할_수_없다() {
        // Given
        given(fileStorageService.store(any(), any())).willReturn("http://test-url/screenshots/test.jpg");
        given(ocrClient.parseMatchScreenshot(any(), any())).willReturn(MatchOcrResult.builder()
                .placement(5).mapName("에란겔").playTime("20:00").playerStats(List.of()).build());

        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");
        long sessionId = 세션을_생성한다(hostToken);
        long teamAId = 팀을_생성한다(sessionId, "팀A", hostToken);
        long teamBId = 팀을_생성한다(sessionId, "팀B", hostToken);
        플레이어를_추가한다(sessionId, teamAId, "PlayerOne", hostToken);
        플레이어를_추가한다(sessionId, teamBId, "PlayerTwo", hostToken);

        String leaderToken = 회원가입하고_토큰을_반환한다("leader", "leader@test.com");
        세션에_참가한다(sessionId, leaderToken);
        리더를_배정한다(sessionId, teamAId, 사용자_ID를_조회한다(leaderToken), hostToken);

        String otherLeaderToken = 회원가입하고_토큰을_반환한다("otherleader", "otherleader@test.com");
        세션에_참가한다(sessionId, otherLeaderToken);
        리더를_배정한다(sessionId, teamBId, 사용자_ID를_조회한다(otherLeaderToken), hostToken);

        기본_팀에_리더와_팀원을_배정한다(sessionId, hostToken);
        post("/api/sessions/" + sessionId + "/start", toJson(Map.of()), hostToken);

        long matchId = 매치_이미지를_업로드한다(sessionId, leaderToken);
        post("/api/matches/" + matchId + "/confirm",
                toJson(Map.of(
                        "playerResults", List.of(Map.of("nickname", "PlayerOne", "kills", 3, "placement", 5, "isTop10", true)),
                        "isChicken", false)),
                leaderToken);

        // When
        ResponseEntity<String> response = delete("/api/matches/" + matchId, otherLeaderToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void 존재하지_않는_매치를_삭제하면_404를_반환한다() {
        // Given
        String hostToken = 회원가입하고_토큰을_반환한다("host", "host@test.com");

        // When
        ResponseEntity<String> response = delete("/api/matches/999999", hostToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
