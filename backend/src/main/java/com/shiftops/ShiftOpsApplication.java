package com.shiftops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ShiftOpsApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShiftOpsApplication.class, args);
    }
}
