[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$projectPath = Join-Path $repositoryRoot 'backend\src\SmartSolarMicrogrid.Api\SmartSolarMicrogrid.Api.csproj'
$publishPath = Join-Path $repositoryRoot 'artifacts\iis\api'

dotnet publish $projectPath /p:PublishProfile=IISFolder --nologo
if ($LASTEXITCODE -ne 0) {
    throw 'The IIS API publish failed.'
}

$requiredFiles = @(
    'SmartSolarMicrogrid.Api.dll',
    'SmartSolarMicrogrid.Api.runtimeconfig.json',
    'web.config'
)

foreach ($requiredFile in $requiredFiles) {
    $requiredPath = Join-Path $publishPath $requiredFile
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Published output is missing $requiredFile."
    }
}

Write-Host "IIS API package created at: $publishPath"
