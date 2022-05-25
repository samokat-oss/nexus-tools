rootProject.name = "Dependency Tree"

pluginManagement {
    repositories {
        fun getProperty(propertyName: String): String =
            extra.properties[propertyName]?.toString()
                ?: System.getenv(propertyName)
                ?: throw IllegalStateException("Please setup '$propertyName' variable")

        mavenCentral()
        gradlePluginPortal()
        maven {
            url = uri("https://nexus.samokat.io/repository/maven-releases")
            credentials {
                username = getProperty("repository_user")
                password = getProperty("repository_password")
            }
        }

        maven {
            url = uri("https://nexus.samokat.io/repository/gradle-plugin-central")
            credentials {
                username = getProperty("repository_user")
                password = getProperty("repository_password")
            }
        }
    }
}
