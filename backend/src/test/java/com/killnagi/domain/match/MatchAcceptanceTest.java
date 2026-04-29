package com.killnagi.domain.match;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.infra.ocr.MatchOcrResult;
import com.killnagi.support.AcceptanceTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@DisplayName("Match 인수 테스트")
class MatchAcceptanceTest extends AcceptanceTestSupport {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchResultRepository matchResultRepository;

    @Autowired
    private TeamPlayerRepository teamPlayerRepository;

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

        // NOTE: MatchResult 생성 API 미구현 — OCR 결과 확인 후 저장하는 엔드포인트 추가 전까지 직접 생성
        Match match = matchRepository.findById(matchId).orElseThrow();
        TeamPlayer player = teamPlayerRepository.findByTeam_Id(teamId).get(0);
        MatchResult savedResult = matchResultRepository.save(
                MatchResult.builder().match(match).teamPlayer(player).kills(3).placement(5).build());

        // When
        ResponseEntity<String> response = post("/api/matches/" + matchId + "/confirm",
                toJson(Map.of("playerResults", List.of(
                        Map.of("matchResultId", savedResult.getId(), "isTop10", true)))),
                leaderToken);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(parseBody(response).at("/data/status").asText()).isEqualTo("CONFIRMED");
    }
}