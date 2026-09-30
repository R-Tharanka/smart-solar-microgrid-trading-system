# Smart Solar Microgrid Android Application

This folder contains the native Android client foundation. It uses Java, XML layouts, AndroidX Navigation, and Material Components. The application ID is `com.smartsolar.microgrid`.

## Requirements

- Android Studio with the Android SDK installed
- Android SDK Platform 36 (API 36) and Android SDK Build-Tools 36.0.0
- JDK 17 or newer (Android Studio's bundled JDK is suitable)
- An Android emulator or physical device running Android 7.0 (API 24) or newer

The Gradle wrapper is included, so a separate Gradle installation is not required.

## Run with Android Studio

1. Open Android Studio.
2. Select **Open** and choose the repository's `mobile` folder.
3. Wait for the Gradle sync to finish.
4. Open **Tools > Device Manager** and create an emulator if one does not exist.
5. Start the emulator.
6. Select the `app` run configuration and the emulator in the toolbar.
7. Click **Run**, or press `Shift+F10`.

The application opens with the branded splash screen and then displays the initial confirmation screen.

## Run from a terminal

Run all commands from the `mobile` directory.

### Windows PowerShell

```powershell
cd mobile
./gradlew.bat assembleDebug
./gradlew.bat installDebug
adb shell am start -n com.smartsolar.microgrid/.MainActivity
```

### macOS or Linux

```bash
cd mobile
chmod +x gradlew
./gradlew assembleDebug
./gradlew installDebug
adb shell am start -n com.smartsolar.microgrid/.MainActivity
```

`installDebug` requires a running emulator or a connected Android device with USB debugging enabled. Confirm that Android Debug Bridge can see it:

```text
adb devices
```

If `adb` is not available globally, run it from the Android SDK `platform-tools` directory or add that directory to `PATH`.

## Start an existing emulator from the terminal

List configured Android Virtual Devices:

```text
emulator -list-avds
```

Start one by replacing `DEVICE_NAME` with a name from that list:

```text
emulator -avd DEVICE_NAME
```

Wait for Android to finish booting, then run the install and launch commands above.

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

## Common setup problems

- **SDK location not found:** Open the project once in Android Studio, or create an untracked `local.properties` file containing `sdk.dir=C:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk` on Windows.
- **No devices/emulators found:** Start an emulator or connect a device, then verify it appears in `adb devices`.
- **Gradle cannot download dependencies:** Check the internet connection and Android Studio's Gradle offline-mode setting.
- **Wrong Java version:** Configure Android Studio's Gradle JDK to its bundled JDK, or set `JAVA_HOME` to JDK 17 or newer.
