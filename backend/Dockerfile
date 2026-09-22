# =========================
# Build stage
# =========================
FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /app

COPY backend/pom.xml .

RUN mvn dependency:go-offline -B

COPY backend/src ./src

RUN mvn clean package -DskipTests


# =========================
# Runtime stage
# =========================
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]