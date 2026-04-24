package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.common.storage.FileStorageService;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchService 스크린샷 업로드 테스트")
class MatchServiceTest {

    @Mock private MatchRepository matchRepository;
    @Mock private FileStorageService fileStorageService;
    @InjectMocks private MatchService matchService;

    private static final Long MATCH_ID = 1L;

    @Test
    void 스크린샷_업로드_성공시_URL을_반환한다() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        Match match = TestFixtures.match(MATCH_ID, session);
        MockMultipartFile file = new MockMultipartFile("image", "result.jpg", "image/jpeg", new byte[1024]);

        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.of(match));
        given(fileStorageService.store(file, "screenshots")).willReturn("http://localhost/files/screenshots/result.jpg");

        ScreenshotUploadResponse response = matchService.uploadScreenshot(MATCH_ID, file);

        assertThat(response.matchId()).isEqualTo(MATCH_ID);
        assertThat(response.screenshotUrl()).isEqualTo("http://localhost/files/screenshots/result.jpg");
    }

    @Test
    void 존재하지_않는_매치에_스크린샷_업로드시_예외가_발생한다() {
        MockMultipartFile file = new MockMultipartFile("image", "result.jpg", "image/jpeg", new byte[1024]);
        given(matchRepository.findById(MATCH_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> matchService.uploadScreenshot(MATCH_ID, file))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("매치를 찾을 수 없습니다.");
    }
}