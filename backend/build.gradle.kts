plugins {
    java
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.shiftops"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.modulith:spring-modulith-starter-jpa:1.3.1")
    implementation("org.springframework.modulith:spring-modulith-events-jpa:1.3.1")
    implementation("org.springframework.modulith:spring-modulith-events-jackson:1.3.1")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5")
    
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    implementation(platform("software.amazon.awssdk:bom:2.29.50"))
    implementation("software.amazon.awssdk:s3")
    
    runtimeOnly("org.postgresql:postgresql")
    
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:junit-jupiter:1.20.4")
    testImplementation("org.testcontainers:postgresql:1.20.4")
    testRuntimeOnly("com.h2database:h2")
}

tasks.withType<Test> {
    useJUnitPlatform()
    systemProperty("user.timezone", "UTC")
}

tasks.named<Test>("test") {
    description = "Runs unit and MockMvc tests (excluding Testcontainers PostgreSQL)."
    exclude("**/PostgresIntegrationTest*")
}

val unitTest = tasks.register<Test>("unitTest") {
    description = "Runs unit and MockMvc tests without requiring Docker or Testcontainers."
    group = "verification"
    useJUnitPlatform()
    systemProperty("user.timezone", "UTC")
    exclude("**/PostgresIntegrationTest*")
}

val integrationTest = tasks.register<Test>("integrationTest") {
    description = "Runs PostgreSQL integration tests using Testcontainers (requires Docker)."
    group = "verification"
    useJUnitPlatform()
    systemProperty("user.timezone", "UTC")
    include("**/PostgresIntegrationTest*")
}
