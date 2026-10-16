# Smart Solar Microgrid Android Application

This folder contains the native Android client. It uses Java, XML layouts, AndroidX Navigation, Material Components, Play Services location, osmdroid/OpenStreetMap map rendering and SQLite. The application ID is `com.smartsolar.microgrid`. Source exists for identity/account, shared Prosumer/Grid Operator map/list station discovery and details, Prosumer slot selection, bounded profile/station reference caching, reservation actions/search/categories/counts, transient approved-booking QR display, Grid Operator camera scanning, server verification and finalization. The APK assembles and 12/12 JVM tests pass, but device/API verification is still absent. The current osmdroid map does not match the assignment's explicit Google Maps requirement.

## Shared mobile infrastructure

- `data/api/ApiClient.java` is the centralized asynchronous JSON API client.
- `data/api/ApiErrorHandler.java` converts HTTP and network failures into safe UI messages.
- `data/session/SessionManager.java` stores one local authenticated session using SQLite.
- `data/identity/UserProfileCache.java` stores the latest authoritative authenticated profile for read-only offline display.
- `data/station/GridNodeReferenceCache.java` stores API-derived station marker/list/detail references; it never stores slots or reservation authority.
- `data/location/DeviceLocationProvider.java` performs one current-location lookup for optional nearby ordering.
- `navigation/RoleNavigator.java` routes supported sessions to the Prosumer or Grid Operator foundation.
- `data/identity/` sends `clientType: Android`; Prosumer deactivation calls the request-only API and displays pending state without logging out.
- `data/station/`, `data/reservation/`, and `ui/prosumer/` contain station/slot browsing, booking actions and QR display.
- `data/transaction/` and `ui/operator/` contain the canonical QR parser, single-use in-memory scanner handoff, transaction DTO/repository code, camera scanning, verification and finalization. Parser/error unit coverage exists; camera/Fragment and device/API evidence remain pending.

The shared local SQLite database is version 3 and contains `session`, `user_profile` and `grid_node_reference`. Profile and station rows are bounded read-only caches with local synchronization timestamps. Passwords, slots and reservations are not stored in SQLite. Server-authoritative account, station activity, live slot availability, reservation, transaction and QR state remain on the API. Logout, expiry and unauthorized-session clearing remove the SQLite authenticated caches.

QR security: raw QR payloads and `transactionToken` are held only in temporary Fragment/process memory. `BookingDetailsFragment` no longer reads or writes `qr_cache`; `MainActivity` clears obsolete legacy entries on startup without touching session or SQLite data. Scanner handoff uses `EphemeralQrPayloadStore.consume()` once rather than persisting raw JSON in navigation state. No QR token is stored in SQLite or logged. Process death intentionally requires a newly issued QR.

## Map provider and Google Maps requirement

The current station screen renders an osmdroid `MapView` with OpenStreetMap tiles. It does not consume the configured Google Maps key. Because the assignment explicitly requires Google Maps, replace the current widget/controller with Google Maps or obtain and document explicit lecturer approval for the provider deviation.

Google Maps dependency and manifest-key configuration remain in the project from the earlier implementation. If the required Google Maps screen is restored, add a real Android Maps SDK key to the ignored `local.properties` file:

```properties
MAPS_API_KEY=YOUR_REAL_GOOGLE_MAPS_ANDROID_KEY
```

The key is injected into `com.google.android.geo.API_KEY` through a manifest placeholder. The build also accepts a Gradle property or `MAPS_API_KEY` environment variable. Do not commit a real key. Restrict it to the Maps SDK for Android, package `com.smartsolar.microgrid`, and the applicable debug/release SHA-1 fingerprints. A configured key alone is not evidence that the current osmdroid screen meets the Google Maps requirement.

The API base URL is selected by a Gradle product flavor in `app/build.gradle.kts`:

```text
emulator:  http://10.0.2.2:5080/
usbDevice: http://127.0.0.1:5080/
iis:       value of IIS_API_BASE_URL (defaults to http://127.0.0.1:8080/)
```

`10.0.2.2` is the Android emulator alias for the host computer. The `usbDevice` flavor uses `adb reverse` so that the physical device's loopback port `5080` is forwarded to the development computer. The `iis` flavor reads `IIS_API_BASE_URL` from the ignored `local.properties` file, a Gradle property, or an environment variable. Select the matching build variant before installing the app.

## Requirements

- Android Studio with the Android SDK installed
- Android SDK Platform 36 (API 36) and Android SDK Build-Tools 36.0.0
- A complete JDK 21 containing both `java.exe` and `jlink.exe` (Android Studio's compatible bundled JBR is also suitable)
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
./gradlew.bat assembleEmulatorDebug assembleUsbDeviceDebug
```

### macOS or Linux

```bash
cd mobile
chmod +x gradlew
./gradlew dependencies
./gradlew assembleEmulatorDebug assembleUsbDeviceDebug
```

The Gradle wrapper downloads the required Gradle and Android dependencies automatically. These commands create separate emulator and USB-device debug APKs under `app/build/outputs/apk/`.

Before building, make sure that Android Studio has the required Android SDK Platform and Build-Tools versions installed. If Gradle cannot find the SDK, open the `mobile` folder in Android Studio or create an untracked `local.properties` file with the path to your Android SDK.

## Backend and API configuration

Before testing API-backed features, start the backend API and confirm that it is listening on `http://localhost:5080`.

- Android Emulator: select `emulatorDebug`; `10.0.2.2` maps to the host computer.
- USB-connected physical device: run `adb reverse tcp:5080 tcp:5080`, then select `usbDeviceDebug`.
- Local IIS assessment: set `IIS_API_BASE_URL=http://YOUR_LAN_IPV4:8080/` in `local.properties`, then select `iisDebug`.
- Production IIS: use an HTTPS URL and remove the local IIS cleartext override before distribution.

The URL must include its trailing `/`. Each flavor permits cleartext traffic only for its local development host. Do not commit environment-specific credentials, tokens, or private keys.

## Run with Android Studio

1. Open Android Studio.
2. Select **Open** and choose the repository's `mobile` folder.
3. Wait for the Gradle sync to finish.
4. Open **Build > Select Build Variant**.
5. For an emulator, select `emulatorDebug`, start the emulator, and choose it in the toolbar.
6. For a physical device, connect it with USB debugging, run `adb reverse tcp:5080 tcp:5080`, select `usbDeviceDebug`, and choose the device in the toolbar.
7. Select the `app` run configuration and click **Run**, or press `Shift+F10`.

The application opens with the branded splash screen and then displays the initial confirmation screen.

## Build debug APK

From the `mobile` directory, run:

### Windows PowerShell

```powershell
./gradlew.bat assembleEmulatorDebug assembleUsbDeviceDebug
```

### macOS or Linux

```bash
./gradlew assembleEmulatorDebug assembleUsbDeviceDebug
```

The APKs are created at `app/build/outputs/apk/emulator/debug/app-emulator-debug.apk` and `app/build/outputs/apk/usbDevice/debug/app-usbDevice-debug.apk`. Debug builds are intended for development and testing, not distribution to end users.

## Run from a terminal

### Windows PowerShell: start the backend

Open a PowerShell window at the repository root and start the API:

```powershell
cd "D:\work\Year - 4\sem 2\EAD\smart-solar-microgrid-trading-system"
dotnet run --project .\backend\src\SmartSolarMicrogrid.Api
```

Keep that window open. In another PowerShell window, verify the API and its MongoDB dependency:

```powershell
Invoke-RestMethod http://localhost:5080/health/live
Invoke-RestMethod http://localhost:5080/health/ready
```

Both health checks should report healthy before testing login.

### Windows PowerShell: USB-connected physical device

Confirm that ADB can see the device. Replace `DEVICE_SERIAL` below with the value printed by `adb devices`:

```powershell
adb devices
adb -s DEVICE_SERIAL reverse tcp:5080 tcp:5080
adb -s DEVICE_SERIAL reverse --list
```

An entry such as `UsbFfs tcp:5080 tcp:5080` confirms that forwarding is active. Then build and install the USB-device flavor:

```powershell
cd "D:\work\Year - 4\sem 2\EAD\smart-solar-microgrid-trading-system\mobile"
.\gradlew.bat installUsbDeviceDebug
adb -s DEVICE_SERIAL shell am force-stop com.smartsolar.microgrid
adb -s DEVICE_SERIAL shell am start -n com.smartsolar.microgrid/.MainActivity
```

If the PowerShell prompt already ends in `\mobile>`, do not run `cd mobile` again. There is no single `installDebug` task after adding product flavors; use `installUsbDeviceDebug` for a physical device or `installEmulatorDebug` for an emulator.

If an emulator and physical device are connected at the same time, build the APK and install it explicitly on the selected device:

```powershell
.\gradlew.bat assembleUsbDeviceDebug
adb -s DEVICE_SERIAL install -r `
  .\app\build\outputs\apk\usbDevice\debug\app-usbDevice-debug.apk
```

The `usbDeviceDebug` application connects to `http://127.0.0.1:5080/`; ADB reverse forwards that address to the API running on the computer. Port forwarding may need to be configured again after disconnecting the USB cable or restarting ADB.

### Windows PowerShell: USB device with the IIS API

Use the `iisDebug` flavor instead of `usbDeviceDebug` when the API is hosted by IIS on port `8080`:

```powershell
adb -s DEVICE_SERIAL reverse --remove tcp:5080
adb -s DEVICE_SERIAL reverse tcp:8080 tcp:8080
adb -s DEVICE_SERIAL reverse --list
.\gradlew.bat installIisDebug
adb -s DEVICE_SERIAL shell am force-stop com.smartsolar.microgrid
adb -s DEVICE_SERIAL shell am start -n com.smartsolar.microgrid/.MainActivity
```

These commands remove the old port-5080 rule, forward the phone's port `8080` to IIS, confirm the forwarding rule, install the IIS-specific APK, and restart the application. Replace `DEVICE_SERIAL` with the identifier printed by `adb devices`.

Copy only commands, not the `PS ...>` prompt, `>>` continuation markers, previous output, or error lines beginning with `+`. If PowerShell is stuck at `>>`, press `Ctrl+C` and retry one command at a time.

The complete IIS workflow, command-by-command explanations, LAN alternative and server checks are documented in [the IIS deployment guide](../docs/deployment/iis-deployment.md#8-point-android-at-iis).

### Windows PowerShell: emulator

The emulator does not require ADB reverse. With the backend running, use:

```powershell
cd "D:\work\Year - 4\sem 2\EAD\smart-solar-microgrid-trading-system\mobile"
.\gradlew.bat installEmulatorDebug
```

The `emulatorDebug` application connects to `http://10.0.2.2:5080/`.

### macOS or Linux

```bash
cd mobile
chmod +x gradlew
# Emulator:
./gradlew installEmulatorDebug
# Or a USB device (run the forwarding command before installation):
adb reverse tcp:5080 tcp:5080
./gradlew installUsbDeviceDebug
adb shell am start -n com.smartsolar.microgrid/.MainActivity
```

The install task requires the matching emulator or USB-debugging device to be connected. On macOS or Linux, confirm that Android Debug Bridge can see it with:

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
./gradlew.bat installEmulatorDebug
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
./gradlew testEmulatorDebugUnitTest testUsbDeviceDebugUnitTest   Run local unit tests for both targets
./gradlew assembleEmulatorDebug assembleUsbDeviceDebug           Build both debug APKs
./gradlew installEmulatorDebug                                  Install the emulator target
./gradlew installUsbDeviceDebug                                 Install the USB-device target
./gradlew clean                                                  Remove generated build output
```

On Windows, replace `./gradlew` with `./gradlew.bat`.

The debug APK is generated at:

```text
app/build/outputs/apk/emulator/debug/app-emulator-debug.apk
app/build/outputs/apk/usbDevice/debug/app-usbDevice-debug.apk
```

## Clean generated files

To remove generated build output, run from the `mobile` directory:

```text
./gradlew clean
```

On Windows, use `./gradlew.bat clean`. The next build will recreate the required output directories and may take longer because Gradle needs to rebuild the project.

## Common setup problems

- **The app cannot reach the API:** Confirm the backend is running on port `5080`. Use `emulatorDebug` for an emulator. For `usbDeviceDebug`, keep the USB connection active and verify `adb reverse --list` includes `tcp:5080 tcp:5080`.
- **Gradle daemon issues:** Run `./gradlew --stop` or `./gradlew.bat --stop`, then retry the command.
- **SDK location not found:** Open the project once in Android Studio, or create an untracked `local.properties` file containing `sdk.dir=C:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk` on Windows.
- **`emulator` is not recognized:** Use `& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"` or add the SDK's `emulator` directory to `PATH`.
- **The AVD list is empty:** Create an emulator in Android Studio under **Tools > Device Manager > Add a new device**.
- **`adb devices` has an empty list:** No device is connected. Start an AVD or connect a physical device with USB debugging enabled, then run the command again.
- **Gradle cannot download dependencies:** Check the internet connection and Android Studio's Gradle offline-mode setting.
- **Missing `jlink.exe` / `JdkImageTransform` failure:** Gradle needs a complete JDK 21 for this Android build. VS Code's Red Hat Java extension may expose a Java 21 runtime that has `java.exe` but no `jlink.exe`; do not use it as Gradle's JDK. In a new PowerShell terminal, point `JAVA_HOME` at an installed full JDK (for example, the Microsoft JDK shown below), verify both executables, then build. The project intentionally does not pin a machine-specific JDK path or use generated daemon-JVM criteria that could select the incomplete VS Code runtime.

  ```powershell
  $env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot'
  Test-Path "$env:JAVA_HOME\bin\java.exe"
  Test-Path "$env:JAVA_HOME\bin\jlink.exe"
  ./gradlew.bat --version
  ./gradlew.bat assembleEmulatorDebug assembleUsbDeviceDebug
  if ($LASTEXITCODE -ne 0) { throw 'Android build failed; do not install an old APK.' }
  ./gradlew.bat installEmulatorDebug
  if ($LASTEXITCODE -ne 0) { throw 'Android installation failed.' }
  $androidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
  & "$androidSdk\platform-tools\adb.exe" shell am force-stop com.smartsolar.microgrid
  & "$androidSdk\platform-tools\adb.exe" shell am start -n com.smartsolar.microgrid/.MainActivity
  ```

  Both `Test-Path` checks must print `True`. Substitute your own complete JDK 21 path if different. In Android Studio, select that full JDK or the bundled JBR as the Gradle JDK. This PowerShell assignment changes only the current terminal; set your user-level `JAVA_HOME` separately if you want it to persist. A failed build followed by `adb shell am start` can merely reopen an older installed APK.
