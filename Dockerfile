# --- Stage 1: Build Stage ---
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# --- Stage 2: Runtime Stage ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /springsieutoc

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]