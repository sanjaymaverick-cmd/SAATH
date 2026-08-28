[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$SshKey,

  [string]$HostName = '130.210.24.150',
  [string]$SshUser = 'ubuntu',
  [string]$AdminLogin = 'owner',
  [string]$AdminName = 'Family Admin',
  # DNS for this hostname must already point at $HostName. When set, the app is
  # served over HTTPS on that domain via the bundled Caddy service (automatic
  # Let's Encrypt certificate); when omitted, plain HTTP on $HostName as before.
  [string]$Domain = ''
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$KeyPath = (Resolve-Path -LiteralPath $SshKey).Path
$RemoteHelper = Join-Path $PSScriptRoot 'oracle-remote.sh'

foreach ($command in 'tar.exe', 'ssh.exe', 'scp.exe') {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command is required. Install Windows OpenSSH Client and use the built-in tar.exe."
  }
}

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$TempRoot = Join-Path ([IO.Path]::GetTempPath()) "saath-deploy-$Stamp"
$Archive = Join-Path $TempRoot 'saath.tar.gz'
New-Item -ItemType Directory -Force -Path $TempRoot | Out-Null

try {
  Write-Host 'Packaging SAATH source...' -ForegroundColor Cyan
  & tar.exe -czf $Archive `
    --exclude='.git' `
    --exclude='.jdk' `
    --exclude='.runtime' `
    --exclude='data' `
    --exclude='media' `
    --exclude='qa' `
    --exclude='frontend/node_modules' `
    --exclude='frontend/dist' `
    --exclude='frontend/android/.gradle' `
    --exclude='frontend/android/build' `
    --exclude='frontend/android/app/build' `
    --exclude='frontend/android/app/src/main/assets' `
    --exclude='frontend/android/capacitor-cordova-android-plugins' `
    --exclude='api/node_modules' `
    --exclude='mcp/node_modules' `
    -C $ProjectRoot .
  if ($LASTEXITCODE -ne 0) { throw 'Packaging failed.' }

  $Target = "$SshUser@$HostName"
  $RemoteArchive = "/tmp/saath-$Stamp.tar.gz"
  $RemoteScript = "/tmp/saath-deploy-$Stamp.sh"

  Write-Host "Uploading to $Target..." -ForegroundColor Cyan
  & scp.exe -i $KeyPath -o StrictHostKeyChecking=accept-new $Archive "${Target}:$RemoteArchive"
  if ($LASTEXITCODE -ne 0) { throw 'Application upload failed.' }
  & scp.exe -i $KeyPath -o StrictHostKeyChecking=accept-new $RemoteHelper "${Target}:$RemoteScript"
  if ($LASTEXITCODE -ne 0) { throw 'Deployment-helper upload failed.' }

  $SafeHost = $HostName.Replace("'", "''")
  $SafeLogin = $AdminLogin.Replace("'", "''")
  $SafeName = $AdminName.Replace("'", "''")
  $SafeDomain = $Domain.Replace("'", "''")
  $RemoteCommand = "chmod +x '$RemoteScript' && '$RemoteScript' '$RemoteArchive' '$SafeHost' '$SafeLogin' '$SafeName' '$SafeDomain'; code=`$?; rm -f '$RemoteArchive' '$RemoteScript'; exit `$code"

  Write-Host 'Installing and starting the application...' -ForegroundColor Cyan
  & ssh.exe -tt -i $KeyPath -o StrictHostKeyChecking=accept-new $Target $RemoteCommand
  if ($LASTEXITCODE -ne 0) { throw 'Remote deployment failed. Review the output above.' }

  $PublicUrl = if ($Domain) { "https://$Domain" } else { "http://$HostName" }
  Write-Host "Checking $PublicUrl/api/health from this computer..." -ForegroundColor Cyan
  try {
    $Health = Invoke-RestMethod -Uri "$PublicUrl/api/health" -TimeoutSec 20
    Write-Host "Deployment complete - $PublicUrl" -ForegroundColor Green
    $Health | ConvertTo-Json -Compress | Write-Host
  } catch {
    if ($Domain) {
      Write-Warning "The server is healthy internally, but the public HTTPS check failed. A fresh Let's Encrypt certificate can take up to a minute - try again shortly. Also confirm TCP 80 and 443 are open in the Oracle Cloud Security List/NSG, and that $Domain's DNS points at $HostName."
    } else {
      Write-Warning "The server is healthy internally, but the public check failed. In Oracle Cloud, allow inbound TCP 80 (and later 443) in the subnet Security List or NSG."
    }
    Write-Host "Try opening: $PublicUrl"
  }
} finally {
  if (Test-Path -LiteralPath $TempRoot) { Remove-Item -LiteralPath $TempRoot -Recurse -Force }
}
