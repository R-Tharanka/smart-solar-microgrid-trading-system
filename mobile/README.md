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

## Common setup problems

- **SDK location not found:** Open the project once in Android Studio, or create an untracked `local.properties` file containing `sdk.dir=C:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk` on Windows.
- **`emulator` is not recognized:** Use `& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"` or add the SDK's `emulator` directory to `PATH`.
- **The AVD list is empty:** Create an emulator in Android Studio under **Tools > Device Manager > Add a new device**.
- **`adb devices` has an empty list:** No device is connected. Start an AVD or connect a physical device with USB debugging enabled, then run the command again.
- **Gradle cannot download dependencies:** Check the internet connection and Android Studio's Gradle offline-mode setting.
- **Wrong Java version:** Configure Android Studio's Gradle JDK to its bundled JDK, or set `JAVA_HOME` to JDK 17 or newer.
