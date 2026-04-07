FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/payment-service-0.0.1-SNAPSHOT.jar app.jar

ENV JAVA_OPTS=""
EXPOSE 3008

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
