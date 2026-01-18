# Build stage
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN gradle build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S dispatch && adduser -S dispatch -G dispatch

# Create upload directory
RUN mkdir -p /app/uploads && chown -R dispatch:dispatch /app

# Copy jar from builder
COPY --from=builder /app/build/libs/*.jar app.jar

# Switch to non-root user
USER dispatch

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=docker -jar app.jar"]
