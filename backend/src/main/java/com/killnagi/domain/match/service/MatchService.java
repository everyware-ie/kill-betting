package com.killnagi.domain.match.service;

import com.killnagi.common.storage.FileStorageService;
import com.killnagi.domain.match.dto.response.ScreenshotUploadResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.infra.ocr.MatchOcrResult;
import com.killnagi.infra.ocr.OcrClient;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final String SCREENSHOT_DIR = "screenshots";

    private final MatchRepository matchRepository;
    private final FileStorageService fileStorageService;
    private final OcrClient ocrClient;
    private final MeterRegistry meterRegistry;

    @Transactional
    public ScreenshotUploadResponse uploadScreenshot(Session session, Team team, MultipartFile file) {
        Timer.Sample sample = Timer.start(meterRegistry);
        String url;
        try {
            url = fileStorageService.store(file, SCREENSHOT_DIR);
            sample.stop(Timer.builder("storage.upload.duration").tag("result", "success").register(meterRegistry));
            meterRegistry.counter("storage.upload", "result", "success").increment();
        } catch (Exception e) {
            sample.stop(Timer.builder("storage.upload.duration").tag("result", "failure").register(meterRegistry));
            meterRegistry.counter("storage.upload", "result", "failure").increment();
            throw e;
        }

        int matchNumber = matchRepository.countBySessionId(session.getId()) + 1;

        Match match = Match.builder()
                .session(session)
                .team(team)
                .matchNumber(matchNumber)
                .screenshotUrl(url)
                .build();
        matchRepository.save(match);

        meterRegistry.counter("match.screenshot.uploaded").increment();

        String imageFormat = getImageFormat(file);
        MatchOcrResult ocrResult = ocrClient.parseMatchScreenshot(file, imageFormat);

        return new ScreenshotUploadResponse(match.getId(), url, ocrResult);
    }

    private String getImageFormat(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }
        return "jpg";
    }
}
