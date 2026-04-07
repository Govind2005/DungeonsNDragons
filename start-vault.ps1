# PowerShell script to load .env and run vault service

# Load .env file
$envFile = "backend/vault/.env"
if (Test-Path $envFile) {
    Write-Host "Loading environment from $envFile..." -ForegroundColor Green
    Get-Content $envFile | Where-Object { $_ -match '^\s*([^=]+)=(.+)$' } | ForEach-Object {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "Set $key" -ForegroundColor Cyan
    }
} else {
    Write-Host ".env file not found at $envFile" -ForegroundColor Red
    Write-Host "Create it by copying .env.example: cp backend/vault/.env.example backend/vault/.env" -ForegroundColor Yellow
    exit 1
}

# Verify password is set
if ([string]::IsNullOrEmpty($env:DB_PASSWORD)) {
    Write-Host "ERROR: DB_PASSWORD is not set!" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Vault service..." -ForegroundColor Green
mvn spring-boot:run -pl backend/vault
