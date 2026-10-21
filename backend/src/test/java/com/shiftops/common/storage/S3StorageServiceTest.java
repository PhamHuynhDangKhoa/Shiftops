package com.shiftops.common.storage;

import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.AbortableInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class S3StorageServiceTest {

    @Mock
    private S3Client s3Client;

    private S3StorageService s3StorageService;

    private static final String BUCKET = "shiftops-test-bucket";

    @BeforeEach
    void setUp() {
        s3StorageService = new S3StorageService(s3Client, BUCKET, true);
    }

    @Test
    void init_WhenBucketExists_DoesNotCreateBucket() {
        when(s3Client.headBucket(any(HeadBucketRequest.class))).thenReturn(HeadBucketResponse.builder().build());

        s3StorageService.init();

        verify(s3Client).headBucket(any(HeadBucketRequest.class));
        verify(s3Client, never()).createBucket(any(CreateBucketRequest.class));
    }

    @Test
    void init_WhenBucketDoesNotExist_CreatesBucket() {
        when(s3Client.headBucket(any(HeadBucketRequest.class)))
                .thenThrow(NoSuchBucketException.builder().message("Bucket does not exist").build());

        s3StorageService.init();

        verify(s3Client).headBucket(any(HeadBucketRequest.class));
        verify(s3Client).createBucket(any(CreateBucketRequest.class));
    }

    @Test
    void store_ValidFile_UploadsToS3() {
        byte[] content = "image-bytes-data".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample-photo.png",
                "image/png",
                content
        );

        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String key = s3StorageService.store(file, "issues/test-issue");

        assertThat(key).startsWith("issues/test-issue/");
        assertThat(key).endsWith(".png");

        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(captor.capture(), any(RequestBody.class));
        PutObjectRequest captured = captor.getValue();
        assertThat(captured.bucket()).isEqualTo(BUCKET);
        assertThat(captured.key()).isEqualTo(key);
        assertThat(captured.contentType()).isEqualTo("image/png");
    }

    @Test
    void store_EmptyFile_ThrowsBusinessRuleException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        assertThatThrownBy(() -> s3StorageService.store(emptyFile, "issues"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("empty file");

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void store_DisallowedExtension_ThrowsBusinessRuleException() {
        MockMultipartFile scriptFile = new MockMultipartFile(
                "file",
                "hack.sh",
                "application/x-sh",
                "echo hello".getBytes()
        );

        assertThatThrownBy(() -> s3StorageService.store(scriptFile, "issues"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not permitted");

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void loadAsResource_Success() throws IOException {
        String testContent = "file content from s3";
        GetObjectResponse response = GetObjectResponse.builder()
                .contentLength((long) testContent.length())
                .contentType("image/png")
                .build();
        ResponseInputStream<GetObjectResponse> s3Stream = new ResponseInputStream<>(
                response,
                AbortableInputStream.create(new ByteArrayInputStream(testContent.getBytes()))
        );

        when(s3Client.getObject(any(GetObjectRequest.class))).thenReturn(s3Stream);

        Resource resource = s3StorageService.loadAsResource("issues/photo.png");

        assertThat(resource).isNotNull();
        assertThat(resource.contentLength()).isEqualTo(testContent.length());
        assertThat(resource.getContentAsByteArray()).isEqualTo(testContent.getBytes());
    }

    @Test
    void loadAsResource_NoSuchKey_ThrowsResourceNotFoundException() {
        when(s3Client.getObject(any(GetObjectRequest.class)))
                .thenThrow(NoSuchKeyException.builder().message("Key not found").build());

        assertThatThrownBy(() -> s3StorageService.loadAsResource("issues/missing.png"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("File");
    }

    @Test
    void loadAsResource_S3NotFoundStatus_ThrowsResourceNotFoundException() {
        S3Exception notFoundException = (S3Exception) S3Exception.builder()
                .statusCode(404)
                .message("Not Found")
                .build();

        when(s3Client.getObject(any(GetObjectRequest.class))).thenThrow(notFoundException);

        assertThatThrownBy(() -> s3StorageService.loadAsResource("issues/missing.png"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("File");
    }

    @Test
    void delete_CallsS3Client() {
        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenReturn(DeleteObjectResponse.builder().build());

        s3StorageService.delete("issues/test-photo.png");

        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(captor.capture());
        DeleteObjectRequest captured = captor.getValue();
        assertThat(captured.bucket()).isEqualTo(BUCKET);
        assertThat(captured.key()).isEqualTo("issues/test-photo.png");
    }
}
