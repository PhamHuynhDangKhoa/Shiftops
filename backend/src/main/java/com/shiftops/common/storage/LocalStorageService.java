package com.shiftops.common.storage;

import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class LocalStorageService implements StorageService {

    private final Path rootLocation;

    public LocalStorageService(@Value("${app.storage.upload-dir:./uploads}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("Initialized storage directory at {}", rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize storage directory", e);
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    @Override
    public String store(MultipartFile file, String subDirectory) {
        if (file.isEmpty()) {
            throw new BusinessRuleException("EMPTY_FILE", "Failed to store empty file");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");

        String fileExtension = "";
        int extIndex = originalFilename.lastIndexOf('.');
        if (extIndex > 0) {
            fileExtension = originalFilename.substring(extIndex);
        }

        String uniqueFileName = UUID.randomUUID() + fileExtension;
        Path targetDir = rootLocation.resolve(subDirectory).normalize();

        try {
            Files.createDirectories(targetDir);
            Path destinationFile = targetDir.resolve(uniqueFileName).normalize();

            if (!destinationFile.startsWith(rootLocation)) {
                throw new BusinessRuleException("SECURITY_ERROR", "Cannot store file outside current storage root");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            String relativePath = subDirectory + "/" + uniqueFileName;
            log.info("Stored file at {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            log.error("Failed to store file {}", originalFilename, e);
            throw new RuntimeException("Failed to store file: " + originalFilename, e);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        try {
            Path file = rootLocation.resolve(storagePath).normalize();
            if (!file.startsWith(rootLocation)) {
                throw new BusinessRuleException("SECURITY_ERROR", "Cannot access file outside current storage root");
            }

            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File", "path", storagePath);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File", "path", storagePath);
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path file = rootLocation.resolve(storagePath).normalize();
            if (file.startsWith(rootLocation)) {
                Files.deleteIfExists(file);
                log.info("Deleted file at {}", storagePath);
            }
        } catch (IOException e) {
            log.warn("Could not delete file at {}: {}", storagePath, e.getMessage());
        }
    }
}
