param(
    [string]$ApiUrl = "https://typely-api.coderpixelbusiness.workers.dev"
)

$ErrorActionPreference = "Stop"
$ApiUrl = $ApiUrl.Trim().TrimEnd("/")

Write-Host "Checking Typely account server..."
$health = Invoke-RestMethod `
    -Method Get `
    -Uri "$ApiUrl/health" `
    -TimeoutSec 20 `
    -Headers @{ Accept = "application/json" }

if (-not $health.ok) {
    throw "The account server did not report a healthy state."
}

if ($health.database -ne "ready") {
    throw "The Typely account database is not ready."
}

if ($health.secrets -ne "ready") {
    throw "The Typely account server secrets are not ready."
}

if ([int]$health.passwordIterations -ne 100000) {
    throw "The deployed password configuration is unexpected."
}

$preflight = Invoke-WebRequest `
    -Method Options `
    -Uri "$ApiUrl/v1/auth/register" `
    -TimeoutSec 20 `
    -Headers @{
        Origin = "http://tauri.localhost"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }

$allowedOrigin = $preflight.Headers["Access-Control-Allow-Origin"]

if ($allowedOrigin -ne "http://tauri.localhost") {
    throw "The server does not allow the Tauri application origin."
}

Write-Host ""
Write-Host "Typely account server is ready." -ForegroundColor Green
Write-Host "URL: $ApiUrl"
Write-Host "Database: $($health.database)"
Write-Host "Secrets: $($health.secrets)"
Write-Host "PBKDF2 iterations: $($health.passwordIterations)"
Write-Host "Tauri CORS: ready"
