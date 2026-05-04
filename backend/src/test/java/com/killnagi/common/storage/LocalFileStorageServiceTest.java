package com.killnagi.common.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.common.exception.KillnagiException;

@DisplayName("LocalFileStorageService 파일 저장 테스트")
class LocalFileStorageServiceTest {

    private LocalFileStorageService storageService;
    private Path tempDir;

    @BeforeEach
    void setUp() throws IOException {
        storageService = new LocalFileStorageService();
        tempDir = Files.createTempDirectory("test-uploads");

        ReflectionTestUtils.setField(storageService, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(storageService, "baseUrl", "http://localhost:8080/files");
    }

    @Test
    void JPEG_파일_업로드시_저장된_파일의_URL을_반환한다() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.jpg", "image/jpeg", new byte[1024]
        );

        // when
        String url = storageService.store(file, "screenshots");

        // then
        assertThat(url).startsWith("http://localhost:8080/files/screenshots/");
        assertThat(url).endsWith(".jpg");
    }

    @Test
    void PNG_파일_업로드시_저장된_파일의_URL을_반환한다() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.png", "image/png", new byte[1024]
        );

        // when
        String url = storageService.store(file, "screenshots");

        // then
        assertThat(url).startsWith("http://localhost:8080/files/screenshots/");
        assertThat(url).endsWith(".png");
    }

    @Test
    void 파일_저장시_실제_파일시스템에_파일이_생성된다() throws IOException {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.jpg", "image/jpeg", new byte[1024]
        );

        // when
        String url = storageService.store(file, "screenshots");

        // then
        String filename = url.substring(url.lastIndexOf("/") + 1);
        Path saved = tempDir.resolve("screenshots").resolve(filename);
        assertThat(Files.exists(saved)).isTrue();
    }

    @Test
    void 빈_파일_업로드시_BadRequest_예외가_발생한다() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.jpg", "image/jpeg", new byte[0]
        );

        // when & then
        assertThatThrownBy(() -> storageService.store(file, "screenshots"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("파일이 비어있습니다.");
    }

    @Test
    void 파일크기_10MB_초과시_BadRequest_예외가_발생한다() {
        // given
        byte[] oversized = new byte[10 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.jpg", "image/jpeg", oversized
        );

        // when & then
        assertThatThrownBy(() -> storageService.store(file, "screenshots"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("파일 크기는 10MB를 초과할 수 없습니다.");
    }

    @ParameterizedTest(name = "ContentType: {0}")
    @ValueSource(strings = {"application/pdf", "image/gif", "text/plain", "video/mp4"})
    void 허용되지않은_파일형식_업로드시_BadRequest_예외가_발생한다(String contentType) {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.pdf", contentType, new byte[1024]
        );

        // when & then
        assertThatThrownBy(() -> storageService.store(file, "screenshots"))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("JPEG, JPG, PNG 형식의 이미지만 업로드 가능합니다.");
    }

    @Test
    void 확장자_없는_파일명_업로드시_URL이_정상_반환된다() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result", "image/jpeg", new byte[1024]
        );

        // when
        String url = storageService.store(file, "screenshots");

        // then
        assertThat(url).startsWith("http://localhost:8080/files/screenshots/");
    }

    @Test
    void 동일_파일을_두번_업로드해도_고유한_파일명이_생성된다() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "result.jpg", "image/jpeg", new byte[1024]
        );

        // when
        String url1 = storageService.store(file, "screenshots");
        String url2 = storageService.store(file, "screenshots");

        // then
        assertThat(url1).isNotEqualTo(url2);
    }
}
