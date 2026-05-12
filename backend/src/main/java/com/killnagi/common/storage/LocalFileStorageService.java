package com.killnagi.common.storage;

import com.killnagi.common.exception.KillnagiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

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
            throw new KillnagiException("파일 저장에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return baseUrl + "/" + directory + "/" + filename;
    }
}