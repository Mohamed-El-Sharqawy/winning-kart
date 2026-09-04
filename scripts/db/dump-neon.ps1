param(
    [string]$OutFile = "",
    [switch]$Plain
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    throw "pg_dump not found on PATH; install PostgreSQL client tools first"
}

$versionOut = (& pg_dump --version) | Select-Object -First 1
if ($versionOut -notmatch "PostgreSQL\)\s+(\d+)\.") {
    throw "Could not parse pg_dump version from '$versionOut'"
}
if ([int]$Matches[1] -lt 18) {
    throw "$versionOut found; pg_dump 18+ is required to match the Neon server (18.6)"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$envFile = Join-Path $repoRoot ".env"

$line = Get-Content -LiteralPath $envFile |
    Where-Object { $_ -match '^\s*DIRECT_DATABASE_URL\s*=' } |
    Select-Object -First 1
if (-not $line) {
    throw "DIRECT_DATABASE_URL not found in .env"
}

$url = (($line -split "=", 2)[1]).Trim().Trim('"').Trim("'")
try {
    $hostName = ([Uri]$url).Host
} catch {
    throw "Could not parse DIRECT_DATABASE_URL as a URI; check the value in .env"
}
if ($hostName -like "*-pooler*") {
    throw "DIRECT_DATABASE_URL uses the Neon pooler host ($hostName); set it to the direct host (no -pooler segment)"
}

$sanitizedUrl = $url -replace "channel_binding=[^&]*&?", ""
$sanitizedUrl = $sanitizedUrl -replace "\?&", "?"
$sanitizedUrl = $sanitizedUrl.TrimEnd("&")

if (-not $OutFile) {
    $OutFile = $(if ($Plain) { "wk-neon.sql" } else { "wk-neon.dump" })
}
$outPath = if ([IO.Path]::IsPathRooted($OutFile)) { $OutFile } else { Join-Path $repoRoot $OutFile }

$dumpArgs = @("--format=custom", "--no-owner", "--no-privileges", "--file=$outPath")
if ($Plain) {
    $dumpArgs = @("--format=plain", "--no-owner", "--no-privileges", "--file=$outPath")
}

& pg_dump $sanitizedUrl @dumpArgs
if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
}

$sizeMb = [Math]::Round((Get-Item -LiteralPath $outPath).Length / 1MB, 2)
Write-Host "Dump written: $outPath ($sizeMb MB) from $hostName"
if ($Plain) {
    Write-Host "Restore (PG 17 target, run inside the postgres container):"
    Write-Host "  psql `"postgresql://winningkart:PASSWORD@localhost:5432/winningkart`" -v ON_ERROR_STOP=1 -f /tmp/wk-neon.sql"
} else {
    Write-Host "Transfer:      scp `"$outPath`" root@<vps-ip>:/tmp/wk-neon.dump"
    Write-Host "Restore on VPS: sudo -u postgres pg_restore --dbname=winningkart --role=winningkart --no-owner --no-privileges /tmp/wk-neon.dump"
}
