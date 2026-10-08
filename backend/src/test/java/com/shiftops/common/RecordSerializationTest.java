package com.shiftops.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RecordSerializationTest {

    @Builder
    public record SampleRecord(
            @NotBlank(message = "Name is required")
            String name,
            int age
    ) {
        public String getName() {
            return name();
        }

        public int getAge() {
            return age();
        }
    }

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void testSerializationAndDeserialization() throws Exception {
        SampleRecord original = SampleRecord.builder().name("Alice").age(30).build();
        String json = objectMapper.writeValueAsString(original);

        assertThat(json).isEqualTo("{\"name\":\"Alice\",\"age\":30}");

        SampleRecord deserialized = objectMapper.readValue(json, SampleRecord.class);
        assertThat(deserialized.name()).isEqualTo("Alice");
        assertThat(deserialized.getName()).isEqualTo("Alice");
        assertThat(deserialized.age()).isEqualTo(30);
        assertThat(deserialized.getAge()).isEqualTo(30);
    }

    @Test
    void testValidationOnRecord() {
        SampleRecord invalid = SampleRecord.builder().name("").age(25).build();
        var violations = validator.validate(invalid);
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Name is required");
    }
}
