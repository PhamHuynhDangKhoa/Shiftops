# ==============================================================================
# ShiftOps Backend - Multi-Stage Production Dockerfile
# ==============================================================================

# Stage 1: Build JAR with Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Copy Gradle wrapper and configuration
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./

# Cache dependencies
RUN ./gradlew dependencies --no-daemon || true

# Copy source code and build bootJar (skipping tests during image packaging)
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Hardened Minimal Runtime Image
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install curl for container healthcheck
RUN apk add --no-cache curl tzdata

# Create dedicated non-root user and group
RUN addgroup -S shiftops && adduser -S shiftops -G shiftops

WORKDIR /app

# Prepare upload directory with proper ownership
RUN mkdir -p /app/uploads && chown -R shiftops:shiftops /app

# Copy artifact from builder stage
COPY --from=builder --chown=shiftops:shiftops /workspace/build/libs/*.jar /app/app.jar

# Run as unprivileged user
USER shiftops:shiftops

EXPOSE 8080

# Environment variables with container-aware defaults
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENV SPRING_PROFILES_ACTIVE="prod"

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
