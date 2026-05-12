package com.killnagi.common.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import static org.assertj.core.api.Assertions.assertThatNoException;

@EnabledIfEnvironmentVariable(named = "AWS_ACCESS_KEY_ID", matches = ".+")
class S3ConnectionTest {

    @Test
    void S3_버킷에_파일을_업로드하고_삭제할_수_있다() {
        String bucketName = System.getenv("AWS_S3_BUCKET_NAME");
        String region = System.getenv("AWS_S3_REGION");
        String accessKey = System.getenv("AWS_ACCESS_KEY_ID");
        String secretKey = System.getenv("AWS_SECRET_ACCESS_KEY");

        S3Client s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();

        String key = "test/s3-connection-test.txt";

        assertThatNoException().isThrownBy(() -> {
            s3.putObject(
                    PutObjectRequest.builder().bucket(bucketName).key(key).build(),
                    RequestBody.fromString("S3 연결 테스트")
            );
            s3.deleteObject(
                    DeleteObjectRequest.builder().bucket(bucketName).key(key).build()
            );
        });
    }
}