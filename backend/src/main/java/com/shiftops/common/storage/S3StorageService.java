package com.shiftops.common.storage;

import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Enterprise cluster storage driver backed by Amazon S3 or MinIO.
 * Enables shared, distributed object storage for multi-instance container clusters.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final String bucketName;
    private final boolean autoCreateBucket;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    );

    public S3StorageService(
            S3Client s3Client,
            @Value("${app.storage.s3.bucket:shiftops}") String bucketName,
            @Value("${app.storage.s3.auto-create-bucket:true}") boolean autoCreateBucket
    ) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.autoCreateBucket = autoCreateBucket;
    }

    @PostConstruct
    public void init() {
        if (autoCreateBucket) {
            try {
                HeadBucketRequest head = HeadBucketRequest.builder().bucket(bucketName).build();
                s3Client.headBucket(head);
                log.info("S3/MinIO bucket '{}' verified.", bucketName);
            } catch (NoSuchBucketException ex) {
                log.info("S3/MinIO bucket '{}' does not exist. Creating it...", bucketName);
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
                log.info("S3/MinIO bucket '{}' created successfully.", bucketName);
            } catch (Exception ex) {
                log.warn("Could not verify or auto-create S3 bucket '{}': {}", bucketName, ex.getMessage());
            }
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
            fileExtension = originalFilename.substring(extIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
            throw new BusinessRuleException("INVALID_FILE_EXTENSION", "File extension '" + fileExtension + "' is not permitted");
        }

        String uniqueFileName = UUID.randomUUID() + fileExtension;
        String cleanSubDir = subDirectory != null
                ? subDirectory.replaceAll("^/+", "").replaceAll("/+$", "").replaceAll("\\.\\.", "")
                : "";
        String key = !cleanSubDir.isBlank() ? cleanSubDir + "/" + uniqueFileName : uniqueFileName;

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Stored file to S3/MinIO [bucket={}, key={}]", bucketName, key);
            return key;
        } catch (IOException e) {
            log.error("Failed to read file input stream for {}", originalFilename, e);
            throw new RuntimeException("Failed to store file: " + originalFilename, e);
        } catch (S3Exception e) {
            log.error("S3 error storing file {} to bucket {}", key, bucketName, e);
            throw new RuntimeException("Failed to upload file to S3: " + e.awsErrorDetails().errorMessage(), e);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        String key = storagePath.replaceAll("^/+", "");
        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            try (ResponseInputStream<GetObjectResponse> s3is = s3Client.getObject(getRequest)) {
                byte[] bytes = s3is.readAllBytes();
                String filename = key.substring(key.lastIndexOf('/') + 1);
                return new ByteArrayResource(bytes) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                };
            }
        } catch (NoSuchKeyException e) {
            throw new ResourceNotFoundException("File", "path", storagePath);
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                throw new ResourceNotFoundException("File", "path", storagePath);
            }
            log.error("S3 error loading file {} from bucket {}", key, bucketName, e);
            throw new RuntimeException("Failed to retrieve file from S3: " + e.awsErrorDetails().errorMessage(), e);
        } catch (IOException e) {
            log.error("I/O error reading S3 stream for {}", key, e);
            throw new RuntimeException("Failed to read file from S3: " + storagePath, e);
        }
    }

    @Override
    public void delete(String storagePath) {
        String key = storagePath.replaceAll("^/+", "");
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("Deleted file from S3/MinIO [bucket={}, key={}]", bucketName, key);
        } catch (S3Exception e) {
            log.warn("Could not delete file from S3 at {}: {}", storagePath, e.getMessage());
        }
    }
}
