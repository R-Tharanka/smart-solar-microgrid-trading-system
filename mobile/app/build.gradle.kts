import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

val localProperties = Properties().apply {
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use { load(it) }
    }
}

val mapsApiKey = localProperties.getProperty("MAPS_API_KEY")
    ?: providers.gradleProperty("MAPS_API_KEY").orNull
    ?: System.getenv("MAPS_API_KEY")
    ?: ""

val iisApiBaseUrl = localProperties.getProperty("IIS_API_BASE_URL")
    ?: providers.gradleProperty("IIS_API_BASE_URL").orNull
    ?: System.getenv("IIS_API_BASE_URL")
    ?: "http://127.0.0.1:8080/"
val normalizedIisApiBaseUrl = if (iisApiBaseUrl.endsWith("/")) iisApiBaseUrl else "$iisApiBaseUrl/"

android {
    namespace = "com.smartsolar.microgrid"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.smartsolar.microgrid"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        manifestPlaceholders["MAPS_API_KEY"] = mapsApiKey
    }

    flavorDimensions += "apiTarget"
    productFlavors {
        create("emulator") {
            dimension = "apiTarget"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:5080/\"")
        }
        create("usbDevice") {
            dimension = "apiTarget"
            buildConfigField("String", "API_BASE_URL", "\"http://127.0.0.1:5080/\"")
        }
        create("iis") {
            dimension = "apiTarget"
            buildConfigField("String", "API_BASE_URL", "\"$normalizedIisApiBaseUrl\"")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    implementation(libs.navigation.fragment)
    implementation(libs.navigation.ui)
    implementation(libs.core.splashscreen)
    implementation(libs.gson)
    implementation(libs.play.services.maps)
    implementation(libs.play.services.location)
    implementation("org.osmdroid:osmdroid-android:6.1.18")
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation(libs.zxing)
    implementation(libs.zxing.embedded)
}
