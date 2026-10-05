# IIS deployment guide

This guide deploys the ASP.NET Core API to IIS first, then points the React and Android clients at that IIS binding. It uses a local assessment binding of `http://localhost:8080`; use HTTPS and a stable host name for a real production deployment.

## 1. Current deployment contract

| Component | Deployment value |
| --- | --- |
| API project | `backend/src/SmartSolarMicrogrid.Api/SmartSolarMicrogrid.Api.csproj` |
| Target framework | `.NET 10` (`net10.0`) |
| IIS site and app pool | `SmartSolarApi` |
| Local IIS binding | `http://localhost:8080` |
| Publish output | `artifacts/iis/api` |
| Liveness endpoint | `http://localhost:8080/health/live` |
| MongoDB readiness endpoint | `http://localhost:8080/health/ready` |

Port `8080` avoids the default IIS site on port `80` and the development/Docker API on port `5080`.

## 2. Prerequisites

Run the machine-level commands in an **Administrator PowerShell** window.

1. Confirm IIS is installed and its services are running:

   ```powershell
   Get-Service W3SVC, WAS
   ```

2. Install or repair the current **.NET 10 Hosting Bundle** after IIS is enabled. Installing only the .NET SDK or ASP.NET Core runtime is not sufficient; IIS also needs the ASP.NET Core Module (ANCM).

3. Restart IIS after the Hosting Bundle installation:

   ```powershell
   net stop was /y
   net start w3svc
   ```

4. Verify ANCM exists:

   ```powershell
   $ancm = "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll"
   Test-Path $ancm
   (Get-Item $ancm).VersionInfo.FileVersion
   ```

`Test-Path` must return `True`. On this machine, the IIS services and .NET 10 runtime were present during the 2026-10-06 inspection, but `aspnetcorev2.dll` was absent. Install or repair the Hosting Bundle before creating the site.

## 3. Prepare deployment configuration

Do not commit the MongoDB connection string, JWT signing key, bootstrap password, or a generated `web.config` containing those values.

The IIS process requires these ASP.NET Core configuration keys:

```text
ASPNETCORE_ENVIRONMENT=Production
MongoDb__ConnectionString=<Atlas SRV connection string>
MongoDb__DatabaseName=smart_solar_microgrid
Jwt__Issuer=SmartSolarMicrogrid.Api
Jwt__Audience=SmartSolarMicrogrid.Clients
Jwt__SigningKey=<at least 32 bytes of random secret material>
BootstrapAdmin__Enabled=false
Cors__AllowedOrigins__0=http://localhost:5173
```

For a hosted React origin, replace or extend the CORS entries. Examples are `http://localhost`, `http://localhost:5173`, or the final HTTPS web origin. CORS origins do not include a trailing slash or an `/api` path.

Configure these values for the `SmartSolarApi` application pool through IIS Manager or the server's protected deployment configuration. After changing them, recycle the application pool. Never put real values in `appsettings.json` or a committed publish profile.

If the first Backoffice account has not been created, enable bootstrap only for the first successful startup and provide all bootstrap fields. Disable it immediately afterward.

## 4. Publish the API

From the repository root:

```powershell
.\deployment\iis\Publish-IisApi.ps1
```

The script runs the repository's `IISFolder` publish profile and verifies that the API DLL, runtime configuration, and generated `web.config` exist under:

```text
artifacts\iis\api
```

The Web SDK generates `web.config`; do not delete it. The publish output is ignored by Git.

## 5. Create or update the IIS site

The repository includes an idempotent local deployment script. It reads MongoDB/JWT values from the untracked root `.env`, writes them only into the deployed `C:\inetpub\SmartSolarApi\web.config`, creates or updates the app pool/site, applies read permissions and starts the site.

Run from **Administrator PowerShell** at the repository root:

```powershell
.\deployment\iis\Install-IisApi.ps1
```

To allow more than one React origin, pass them explicitly:

```powershell
.\deployment\iis\Install-IisApi.ps1 `
  -CorsAllowedOrigins 'http://localhost:5173','http://localhost'
```

Use `-EnableBootstrapAdmin` only if the initial Backoffice account does not exist. The script otherwise forces bootstrap off even if the development `.env` enables it.

The script intentionally restricts its deployment target to a child of `C:\inetpub`. Keep the application pool's **.NET CLR Version** set to **No Managed Code** and use the default **ApplicationPoolIdentity**.

The deployed `web.config` contains secrets and must not be committed, shared, or used as assessment evidence. Capture only file names or redact values in screenshots.

## 6. Verify IIS and MongoDB

```powershell
Invoke-RestMethod http://localhost:8080/health/live
Invoke-RestMethod http://localhost:8080/health/ready
Invoke-RestMethod http://localhost:8080/api/system/info
```

Expected results:

- `/health/live` proves IIS, ANCM, and the API process are reachable.
- `/health/ready` proves the deployed API can reach MongoDB.
- `/api/system/info` proves an application endpoint is executing through IIS.

An HTTP `401` from a protected endpoint is also valid reachability evidence, but it does not prove authentication or database operations. Complete deployment evidence should include login, an authenticated `/api/users/me` request, and a MongoDB-backed read or write.

## 7. Point the React client at IIS

Copy the example without committing the local file:

```powershell
Copy-Item .\web\.env.iis.example .\web\.env.iis.local
```

For a browser on the IIS computer, use:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

Then build:

```powershell
cd .\web
npm run build:iis
```

The value is embedded at build time. Rebuild after changing it. Hosting the React `dist` directory in IIS is a separate static-site step; the API deployment does not automatically host React.

## 8. Point Android at IIS

Find the IIS computer's current LAN IPv4 address:

```powershell
ipconfig
```

The phone and computer must be on the same network. Add this untracked value to `mobile/local.properties`:

```properties
IIS_API_BASE_URL=http://YOUR_LAN_IPV4:8080/
```

The trailing slash is normalized by Gradle. Build and install the IIS flavor:

```powershell
cd .\mobile
.\gradlew.bat installIisDebug
```

The `iis` flavor permits cleartext HTTP only to support a local assessment deployment. A real production deployment must use HTTPS; when HTTPS is configured, remove the cleartext IIS flavor override.

To allow a physical phone to reach the local HTTP binding, add a narrowly scoped Windows Firewall rule from Administrator PowerShell:

```powershell
New-NetFirewallRule `
  -DisplayName 'Smart Solar API IIS 8080 (Private)' `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 8080 `
  -Profile Private
```

Do not open the port on Public profiles. If the LAN address changes, update `IIS_API_BASE_URL` and rebuild the app.

## 9. Troubleshooting

| Symptom | Likely cause/check |
| --- | --- |
| IIS `500.19` or unknown `aspNetCore` section | Hosting Bundle/ANCM missing or installed before IIS; install or repair it and restart IIS. |
| IIS `500.30` | API failed during startup; check Event Viewer and temporarily enable ANCM stdout logging only while diagnosing. Common causes are missing JWT/MongoDB configuration or MongoDB initialization failure. |
| `/health/live` works but `/health/ready` fails | MongoDB connection string, Atlas IP access list, DNS, or database availability. |
| React reports a CORS error | The browser origin is missing from `Cors__AllowedOrigins__N`, or the app pool was not recycled. |
| Android reports it cannot reach the server | Wrong LAN IP, Windows Firewall, different Wi-Fi network, IIS binding unavailable, or the wrong Android build flavor. |
| HTTP redirects unexpectedly | Configure an IIS HTTPS binding and certificate, or verify the API's HTTPS-redirection behavior for the selected assessment binding. |

## 10. Evidence checklist

Capture evidence only after the live checks pass:

- IIS Manager showing `SmartSolarApi`, its binding, and running application pool.
- Published folder containing the generated `web.config` and API DLL.
- `/health/live` and `/health/ready` responses from port `8080`.
- Successful login and authenticated request through the IIS URL.
- React calling the IIS URL.
- Android `iisDebug` calling the IIS URL from a physical device.
- A corresponding MongoDB Atlas record/read proving database integration.

Build success and an IIS Manager screenshot alone are not live end-to-end proof.

## Official references

- [Publish an ASP.NET Core app to IIS](https://learn.microsoft.com/en-us/aspnet/core/tutorials/publish-to-iis?view=aspnetcore-10.0)
- [.NET Hosting Bundle](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/hosting-bundle?view=aspnetcore-10.0)
- [ASP.NET Core Module for IIS](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/aspnet-core-module?view=aspnetcore-10.0)
- [IIS web.config guidance](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/web-config?view=aspnetcore-10.0)
