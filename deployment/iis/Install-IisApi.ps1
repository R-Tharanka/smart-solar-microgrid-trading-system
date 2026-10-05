[CmdletBinding()]
param(
    [string]$SiteName = 'SmartSolarApi',
    [string]$AppPoolName = 'SmartSolarApi',
    [ValidateRange(1, 65535)]
    [int]$Port = 8080,
    [string]$SitePath = 'C:\inetpub\SmartSolarApi',
    [string[]]$CorsAllowedOrigins = @('http://localhost:5173'),
    [switch]$EnableBootstrapAdmin
)

$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from an Administrator PowerShell window.'
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$publishScript = Join-Path $PSScriptRoot 'Publish-IisApi.ps1'
$publishPath = Join-Path $repositoryRoot 'artifacts\iis\api'
$envPath = Join-Path $repositoryRoot '.env'
$appcmd = Join-Path $env:windir 'System32\inetsrv\appcmd.exe'
$ancm = Join-Path $env:ProgramFiles 'IIS\Asp.Net Core Module\V2\aspnetcorev2.dll'
$resolvedSitePath = [IO.Path]::GetFullPath($SitePath)
$inetpubRoot = [IO.Path]::GetFullPath('C:\inetpub') + [IO.Path]::DirectorySeparatorChar

if (-not $resolvedSitePath.StartsWith($inetpubRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'SitePath must be a child directory of C:\inetpub.'
}
if (-not (Test-Path -LiteralPath $appcmd -PathType Leaf)) {
    throw 'IIS appcmd.exe was not found. Enable IIS before running this script.'
}
if (-not (Test-Path -LiteralPath $ancm -PathType Leaf)) {
    throw 'ASP.NET Core Module V2 was not found. Install or repair the .NET 10 Hosting Bundle after enabling IIS.'
}
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
    throw 'The untracked repository .env file is required for MongoDB and JWT settings.'
}

$deploymentSettings = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        continue
    }

    $name = $Matches[1]
    $value = $Matches[2].Trim()
    if ($value.Length -ge 2 -and
        (($value.StartsWith('"') -and $value.EndsWith('"')) -or
         ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    $deploymentSettings[$name] = $value
}

foreach ($requiredName in @('MONGODB_CONNECTION_STRING', 'MONGODB_DATABASE_NAME', 'JWT_SIGNING_KEY')) {
    if (-not $deploymentSettings.ContainsKey($requiredName) -or
        [string]::IsNullOrWhiteSpace($deploymentSettings[$requiredName])) {
        throw "$requiredName must have a value in the untracked .env file."
    }
}
if ([Text.Encoding]::UTF8.GetByteCount($deploymentSettings['JWT_SIGNING_KEY']) -lt 32) {
    throw 'JWT_SIGNING_KEY must contain at least 32 bytes of secret material.'
}
if ($CorsAllowedOrigins.Count -eq 0) {
    throw 'At least one CORS origin is required.'
}
foreach ($origin in $CorsAllowedOrigins) {
    $uri = $null
    if (-not [Uri]::TryCreate($origin, [UriKind]::Absolute, [ref]$uri) -or
        $uri.Scheme -notin @('http', 'https')) {
        throw "Invalid CORS origin: $origin"
    }
}

if ($EnableBootstrapAdmin) {
    foreach ($requiredName in @('BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD')) {
        if (-not $deploymentSettings.ContainsKey($requiredName) -or
            [string]::IsNullOrWhiteSpace($deploymentSettings[$requiredName])) {
            throw "$requiredName is required when EnableBootstrapAdmin is selected."
        }
    }
}

& $publishScript

$siteExists = (& $appcmd list site /name:$SiteName /xml 2>$null) -match '<SITE'
$poolExists = (& $appcmd list apppool /name:$AppPoolName /xml 2>$null) -match '<APPPOOL'

if ($poolExists) {
    & $appcmd stop apppool /apppool.name:$AppPoolName 2>$null | Out-Null
}

New-Item -ItemType Directory -Force -Path $resolvedSitePath | Out-Null
Copy-Item -Path (Join-Path $publishPath '*') -Destination $resolvedSitePath -Recurse -Force

$deployedWebConfig = Join-Path $resolvedSitePath 'web.config'
[xml]$webConfig = Get-Content -LiteralPath $deployedWebConfig
$aspNetCore = $webConfig.SelectSingleNode('/configuration/location/system.webServer/aspNetCore')
if ($null -eq $aspNetCore) {
    throw 'The published web.config does not contain the ASP.NET Core Module configuration.'
}

$existingEnvironmentVariables = $aspNetCore.SelectSingleNode('environmentVariables')
if ($null -ne $existingEnvironmentVariables) {
    [void]$aspNetCore.RemoveChild($existingEnvironmentVariables)
}
$environmentVariables = $webConfig.CreateElement('environmentVariables')
[void]$aspNetCore.AppendChild($environmentVariables)

$iisEnvironment = [ordered]@{
    ASPNETCORE_ENVIRONMENT = 'Production'
    MongoDb__ConnectionString = $deploymentSettings['MONGODB_CONNECTION_STRING']
    MongoDb__DatabaseName = $deploymentSettings['MONGODB_DATABASE_NAME']
    Jwt__Issuer = 'SmartSolarMicrogrid.Api'
    Jwt__Audience = 'SmartSolarMicrogrid.Clients'
    Jwt__SigningKey = $deploymentSettings['JWT_SIGNING_KEY']
    BootstrapAdmin__Enabled = $EnableBootstrapAdmin.IsPresent.ToString().ToLowerInvariant()
}
if ($EnableBootstrapAdmin) {
    $iisEnvironment['BootstrapAdmin__Email'] = $deploymentSettings['BOOTSTRAP_ADMIN_EMAIL']
    $iisEnvironment['BootstrapAdmin__Password'] = $deploymentSettings['BOOTSTRAP_ADMIN_PASSWORD']
    $iisEnvironment['BootstrapAdmin__FirstName'] = 'System'
    $iisEnvironment['BootstrapAdmin__LastName'] = 'Administrator'
}
for ($index = 0; $index -lt $CorsAllowedOrigins.Count; $index++) {
    $iisEnvironment["Cors__AllowedOrigins__$index"] = $CorsAllowedOrigins[$index]
}

foreach ($entry in $iisEnvironment.GetEnumerator()) {
    $variable = $webConfig.CreateElement('environmentVariable')
    $variable.SetAttribute('name', $entry.Key)
    $variable.SetAttribute('value', $entry.Value)
    [void]$environmentVariables.AppendChild($variable)
}
$webConfig.Save($deployedWebConfig)

if (-not $poolExists) {
    & $appcmd add apppool /name:$AppPoolName | Out-Null
}
& $appcmd set apppool /apppool.name:$AppPoolName /managedRuntimeVersion:"" | Out-Null

if (-not $siteExists) {
    & $appcmd add site /name:$SiteName /bindings:"http/*:${Port}:" /physicalPath:$resolvedSitePath | Out-Null
} else {
    & $appcmd set site /site.name:$SiteName /bindings:"http/*:${Port}:" | Out-Null
    & $appcmd set vdir "$SiteName/" /physicalPath:$resolvedSitePath | Out-Null
}
& $appcmd set app "$SiteName/" /applicationPool:$AppPoolName | Out-Null

& icacls $resolvedSitePath /grant "IIS AppPool\${AppPoolName}:(OI)(CI)RX" /T | Out-Null
& $appcmd start apppool /apppool.name:$AppPoolName 2>$null | Out-Null
& $appcmd start site /site.name:$SiteName 2>$null | Out-Null

Write-Host "IIS site '$SiteName' is configured at http://localhost:$Port"
Write-Host "Verify: http://localhost:$Port/health/live and /health/ready"
