package com.killnagi.domain.match.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.killnagi.common.storage.FileStorageService;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.user.entity.User;
import com.killnagi.infra.ocr.MatchOcrResult;
import com.killnagi.infra.ocr.OcrClient;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchService 스크린샷 업로드 테스트")
class MatchServiceTest {

    @Mock private MatchRepository matchRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private OcrClient ocrClient;
    @InjectMocks private MatchService matchService;

    @Test
    void 스크린샷_업로드_성공시_URL을_반환한다() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(1L, host);
        Team team = TestFixtures.team(session);
        MockMultipartFile file = new MockMultipartFile("image", "result.jpg", "image/jpeg", new byte[1024]);

        given(matchRepository.countBySessionId(session.getId())).willReturn(0);
        given(fileStorageService.store(file, "screenshots")).willReturn("http://localhost/files/screenshots/result.jpg");
        given(ocrClient.parseMatchScreenshot(any(), anyString())).willReturn(MatchOcrResult.builder().playerStats(List.of()).build());

        ScreenshotUploadResponse response = matchService.uploadScreenshot(session, team, file);

        assertThat(response.screenshotUrl()).isEqualTo("http://localhost/files/screenshots/result.jpg");
    }
}
