package com.killnagi.common.storage;

import com.killnagi.common.exception.KillnagiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of(
            "image/jpeg", "image/png"
    );

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${file.base-url:http://localhost:8080/files}")
    private String baseUrl;

    @Override
    public String store(MultipartFile file, String directory) {
        validate(file);

        String filename = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        Path targetDir = Paths.get(uploadDir, directory);

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetDir.resolve(filename));
        } catch (IOException e) {
            throw new KillnagiException("파일 저장에 실패했습니다.", org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return baseUrl + "/" + directory + "/" + filename;
    }

    private void validate(MultipartFile file) {
        if (file.isEmpty()) {
            throw KillnagiException.badRequest("파일이 비어있습니다.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw KillnagiException.badRequest("파일 크기는 10MB를 초과할 수 없습니다.");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw KillnagiException.badRequest("JPG, PNG 형식의 이미지만 업로드 가능합니다.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
