FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

COPY application.properties axonsynapse.properties
COPY axonsynapse-0.6.2.jar axonsynapse-0.6.2.jar

CMD ["java", "-jar", "/app/axonsynapse-0.6.2.jar"]