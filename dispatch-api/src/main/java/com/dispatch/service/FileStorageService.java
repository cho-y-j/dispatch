package com.dispatch.service;

import com.dispatch.exception.CustomException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
            log.info("File upload directory created: {}", uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        if (originalFilename.contains("..")) {
            throw CustomException.badRequest("잘못된 파일명입니다: " + originalFilename);
        }

        // 파일 확장자 검증
        String extension = getFileExtension(originalFilename);
        if (!isAllowedExtension(extension)) {
            throw CustomException.badRequest("허용되지 않는 파일 형식입니다: " + extension);
        }

        // 고유 파일명 생성
        String newFilename = UUID.randomUUID().toString() + "." + extension;

        try {
            Path targetDir = uploadPath.resolve(subDirectory);
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(newFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File stored: {}", targetPath);

            return subDirectory + "/" + newFilename;
        } catch (IOException e) {
            throw new RuntimeException("파일 저장에 실패했습니다: " + originalFilename, e);
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path path = uploadPath.resolve(filePath);
            Files.deleteIfExists(path);
            log.info("File deleted: {}", path);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
        }
    }

    public Path getFilePath(String filePath) {
        return uploadPath.resolve(filePath).normalize();
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "";
    }

    private boolean isAllowedExtension(String extension) {
        return extension.matches("^(jpg|jpeg|png|pdf|gif)$");
    }
}
