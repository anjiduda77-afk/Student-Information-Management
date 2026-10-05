# ============================================================
# Smart Student Information System — Backend Dockerfile
# Aditya University | Developer: Vijay
# ============================================================

# Stage 1: Build JAR with Maven & Eclipse Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN ./mvnw dependency:go-offline -B

# Copy sources and build production package
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
