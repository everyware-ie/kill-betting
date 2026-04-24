package com.killnagi.common.storage;

import com.killnagi.common.exception.KillnagiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
    @DisplayName("JPEG 파일 업로드 시 저장된 파일의 URL을 반환한다")
    void should_ReturnUrl_when_JpegFileIsValid() {
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
    @DisplayName("PNG 파일 업로드 시 저장된 파일의 URL을 반환한다")
    void should_ReturnUrl_when_PngFileIsValid() {
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
    @DisplayName("파일 저장 시 실제 파일 시스템에 파일이 생성된다")
    void should_CreateFile_when_FileIsStored() throws IOException {
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
    @DisplayName("빈 파일 업로드 시 BadRequest 예외가 발생한다")
    void should_ThrowBadRequest_when_FileIsEmpty() {
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
    @DisplayName("10MB 초과 파일 업로드 시 BadRequest 예외가 발생한다")
    void should_ThrowBadRequest_when_FileSizeExceeds10MB() {
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
    @DisplayName("허용되지 않은 파일 형식(PDF, GIF 등) 업로드 시 BadRequest 예외가 발생한다")
    @ValueSource(strings = {"application/pdf", "image/gif", "text/plain", "video/mp4"})
    void should_ThrowBadRequest_when_ContentTypeIsNotAllowed(String contentType) {
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
    @DisplayName("확장자 없는 파일명으로 업로드 시 URL이 정상 반환된다")
    void should_ReturnUrlWithoutExtension_when_FilenameHasNoExtension() {
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
    @DisplayName("동일 파일을 두 번 업로드해도 고유한 파일명이 생성된다")
    void should_GenerateUniqueFilename_when_SameFileUploadedTwice() {
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
