# Smart Solar Microgrid Android Application

This folder contains the native Android client foundation. It uses Java, XML layouts, AndroidX Navigation, and Material Components. The application ID is `com.smartsolar.microgrid`.

## Shared mobile infrastructure

- `data/api/ApiClient.java` is the centralized asynchronous JSON API client.
- `data/api/ApiErrorHandler.java` converts HTTP and network failures into safe UI messages.
- `data/session/SessionManager.java` stores one local authenticated session using SQLite.
- `navigation/RoleNavigator.java` routes supported sessions to the Prosumer or Grid Operator foundation.

The local SQLite database stores only the access token, role, display name, and token expiry. Server-authoritative account, reservation, station, transaction, and QR state must remain on the API.

The API base URL is configured once as `API_BASE_URL` in `app/build.gradle.kts`. Its development value is:

```text
http://10.0.2.2:5080/
```

`10.0.2.2` is the Android emulator alias for the host computer. Replace the Gradle value with the HTTPS IIS URL when deployment is available, then sync and rebuild the project. Physical devices cannot use `10.0.2.2`; for local physical-device testing, use a host address reachable from that device.

## Requirements

- Android Studio with the Android SDK installed
- Android SDK Platform 36 (API 36) and Android SDK Build-Tools 36.0.0
- JDK 17 or newer (Android Studio's bundled JDK is suitable)
- An Android emulator or physical device running Android 7.0 (API 24) or newer

The Gradle wrapper is included, so a separate Gradle installation is not required.

## Project structure

- `app/src/main/java/` contains the Java application source code.
- `app/src/main/res/` contains layouts, navigation, themes, drawables, and other Android resources.
- `app/src/main/AndroidManifest.xml` declares the application, permissions, and main activity.
- `app/src/test/` contains local JVM unit tests.
- `app/src/androidTest/` contains tests that run on an emulator or physical device.
- `app/build.gradle.kts` contains the Android build configuration and API base URL.

Generated directories such as `app/build/` and local machine configuration such as `local.properties` should not be committed.

## Setup after cloning

After cloning the repository, run the following steps from the repository root:

### Windows PowerShell

```powershell
cd mobile
./gradlew.bat dependencies
./gradlew.bat assembleDebug
```

### macOS or Linux

```bash
cd mobile
chmod +x gradlew
./gradlew dependencies
./gradlew assembleDebug
```

The Gradle wrapper downloads the required Gradle and Android dependencies automatically. The `assembleDebug` command confirms that the mobile app is configured correctly and creates a debug APK at `app/build/outputs/apk/debug/app-debug.apk`.

Before building, make sure that Android Studio has the required Android SDK Platform and Build-Tools versions installed. If Gradle cannot find the SDK, open the `mobile` folder in Android Studio or create an untracked `local.properties` file with the path to your Android SDK.

## Backend and API configuration

The default API URL is `http://10.0.2.2:5080/`. Before testing API-backed features, start the backend API and confirm that it is listening on port `5080`.

- Android Emulator: keep `10.0.2.2`, which maps to the host computer.
- Physical device: replace `API_BASE_URL` in `app/build.gradle.kts` with an address reachable from the device, such as the host computer's local network address.
- Deployed environment: replace it with the HTTPS IIS or production API URL, then sync and rebuild.

The URL must include its trailing `/`. The current local HTTP configuration permits cleartext traffic for `10.0.2.2`; other HTTP hosts require a corresponding update to the network security configuration. Do not commit environment-specific credentials, tokens, or private keys.

## Run with Android Studio

1. Open Android Studio.
2. Select **Open** and choose the repository's `mobile` folder.
3. Wait for the Gradle sync to finish.
4. Open **Tools > Device Manager** and create an emulator if one does not exist.
5. Start the emulator.
6. Select the `app` run configuration and the emulator in the toolbar.
7. Click **Run**, or press `Shift+F10`.

The application opens with the branded splash screen and then displays the initial confirmation screen.

## Build debug APK

From the `mobile` directory, run:

### Windows PowerShell

```powershell
./gradlew.bat assembleDebug
```

### macOS or Linux

```bash
./gradlew assembleDebug
```

The debug APK is created at `app/build/outputs/apk/debug/app-debug.apk`. Debug builds are intended for development and testing, not distribution to end users.

## Run from a terminal

Run all commands from the `mobile` directory.

### Windows PowerShell

```powershell
cd mobile
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
./gradlew.bat assembleDebug
./gradlew.bat installDebug
& "$androidSdk\platform-tools\adb.exe" shell am start -n com.smartsolar.microgrid/.MainActivity
```

### macOS or Linux

```bash
cd mobile
chmod +x gradlew
./gradlew assembleDebug
./gradlew installDebug
adb shell am start -n com.smartsolar.microgrid/.MainActivity
```

`installDebug` requires a running emulator or a connected Android device with USB debugging enabled. On Windows PowerShell, confirm that Android Debug Bridge can see it with:

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
& "$androidSdk\platform-tools\adb.exe" devices
```

On macOS or Linux, use:

```text
adb devices
```

If `adb` is not available globally, run it from the Android SDK `platform-tools` directory or add that directory to `PATH`.

## Release APK and app bundle

Release artifacts can be built from the `mobile` directory. The current project does not define a release signing configuration, so these commands produce unsigned artifacts:

### Windows PowerShell

```powershell
./gradlew.bat assembleRelease
./gradlew.bat bundleRelease
```

### macOS or Linux

```bash
./gradlew assembleRelease
./gradlew bundleRelease
```

The expected outputs are:

```text
app/build/outputs/apk/release/app-release-unsigned.apk
app/build/outputs/bundle/release/app-release.aab
```

Unsigned release artifacts cannot be published as a normal production app. For a distributable release, use Android Studio's **Build > Generate Signed Bundle / APK** flow or configure a release signing key through local, ignored Gradle properties or environment variables. Never commit a keystore, signing password, or private signing key to the repository.

Example of creating a local keystore on Windows PowerShell:

```powershell
keytool -genkeypair `
	-alias smart-solar-release `
	-keyalg RSA `
	-keysize 2048 `
	-validity 10000 `
	-keystore "$HOME\smart-solar-release.jks"
```

Back up the keystore securely. Losing the signing key can prevent updates to an already-published application.

## Test and lint

Run local JVM unit tests without a device:

```text
./gradlew test
./gradlew testDebugUnitTest
```

Run instrumentation tests with a booted emulator or connected device:

```text
./gradlew connectedDebugAndroidTest
```

Run Android lint checks:

```text
./gradlew lint
./gradlew lintDebug
```

On Windows, replace `./gradlew` with `./gradlew.bat`. Test reports are written below `app/build/reports/tests/` and `app/build/reports/androidTests/`; lint reports are written below `app/build/reports/`.

## Start an existing emulator from the terminal

### Windows PowerShell

The Android SDK tools are not always added to the Windows `PATH`. Call them using their full SDK paths:

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
& "$androidSdk\emulator\emulator.exe" -list-avds
```

If this command returns no names, no Android Virtual Device has been created. Create one in Android Studio using **Tools > Device Manager > Add a new device**, select a phone, choose an installed system image, and finish the wizard.

After creating the device, list the AVDs again and start one by replacing `DEVICE_NAME` with the returned name:

```powershell
& "$androidSdk\emulator\emulator.exe" -avd DEVICE_NAME
```

Keep that PowerShell window open while the emulator runs. In a second PowerShell window, return to the `mobile` directory and run:

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
./gradlew.bat installDebug
& "$androidSdk\platform-tools\adb.exe" shell am start -n com.smartsolar.microgrid/.MainActivity
```

### macOS or Linux

List configured Android Virtual Devices:

```text
emulator -list-avds
```

Start one by replacing `DEVICE_NAME` with a name from that list:

```text
emulator -avd DEVICE_NAME
```

Wait for Android to finish booting, then run the install and launch commands above.

### Optional: add Android tools to the current PowerShell session

This makes the shorter `adb` and `emulator` commands available until the terminal is closed:

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$androidSdk\platform-tools;$androidSdk\emulator"
adb devices
emulator -list-avds
```

## Useful Gradle commands

```text
./gradlew testDebugUnitTest   Run local unit tests
./gradlew assembleDebug       Build the debug APK
./gradlew installDebug        Install on a connected device
./gradlew clean               Remove generated build output
```

On Windows, replace `./gradlew` with `./gradlew.bat`.

The debug APK is generated at:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Clean generated files

To remove generated build output, run from the `mobile` directory:

```text
./gradlew clean
```

On Windows, use `./gradlew.bat clean`. The next build will recreate the required output directories and may take longer because Gradle needs to rebuild the project.

## Common setup problems

- **The app cannot reach the API:** Confirm the backend is running on port `5080`. Use `10.0.2.2` only from an Android Emulator; a physical device needs a reachable host address and matching cleartext or HTTPS configuration.
- **Gradle daemon issues:** Run `./gradlew --stop` or `./gradlew.bat --stop`, then retry the command.
- **SDK location not found:** Open the project once in Android Studio, or create an untracked `local.properties` file containing `sdk.dir=C:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk` on Windows.
- **`emulator` is not recognized:** Use `& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"` or add the SDK's `emulator` directory to `PATH`.
- **The AVD list is empty:** Create an emulator in Android Studio under **Tools > Device Manager > Add a new device**.
- **`adb devices` has an empty list:** No device is connected. Start an AVD or connect a physical device with USB debugging enabled, then run the command again.
- **Gradle cannot download dependencies:** Check the internet connection and Android Studio's Gradle offline-mode setting.
- **Wrong Java version:** Configure Android Studio's Gradle JDK to its bundled JDK, or set `JAVA_HOME` to JDK 17 or newer.
