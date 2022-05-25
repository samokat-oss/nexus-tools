import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.api.tasks.testing.logging.TestLogEvent
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

fun getProperty(propertyName: String): String {
    return project.findProperty(propertyName)?.toString()
        ?: System.getenv(propertyName)
        ?: throw IllegalStateException("Please setup '$propertyName' variable")
}

repositories {
    mavenCentral()
    gradlePluginPortal()
    maven {
        url = uri("https://nexus.samokat.io/repository/maven-releases")
        credentials {
            username = getProperty("repository_user")
            password = getProperty("repository_password")
        }
    }
}

plugins {
    id("ru.samokat.platform") version "3.6.0"
}

group = "ru.samokat.dependencies"

dependencies {
    __@dependencies__
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
    withSourcesJar()
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = JavaVersion.VERSION_11.toString()
        allWarningsAsErrors = true
    }
}
