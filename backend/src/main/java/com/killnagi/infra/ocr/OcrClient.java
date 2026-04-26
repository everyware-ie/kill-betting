package com.killnagi.infra.ocr;

import org.springframework.web.multipart.MultipartFile;

public interface OcrClient {
    MatchOcrResult parseMatchScreenshot(MultipartFile file, String imageFormat);
}