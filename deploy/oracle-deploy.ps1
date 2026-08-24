[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$SshKey,

  [string]$HostName = '130.210.24.150',
  [string]$SshUser = 'ubuntu',
  [string]$AdminLogin = 'owner',
  [string]$AdminName = 'Family Admin'
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
$TempRoot = Join-Path ([IO.Path]::GetTempPath()) "fitfam-deploy-$Stamp"
$Archive = Join-Path $TempRoot 'bagriya-fitfam.tar.gz'
New-Item -ItemType Directory -Force -Path $TempRoot | Out-Null

try {
  Write-Host 'Packaging Bagriya FitFam source…' -ForegroundColor Cyan
  & tar.exe -czf $Archive `
    --exclude='.git' `
    --exclude='.runtime' `
    --exclude='data' `
    --exclude='media' `
    --exclude='qa' `
    --exclude='frontend/node_modules' `
    --exclude='frontend/dist' `
    --exclude='api/node_modules' `
    -C $ProjectRoot .
  if ($LASTEXITCODE -ne 0) { throw 'Packaging failed.' }

  $Target = "$SshUser@$HostName"
  $RemoteArchive = "/tmp/bagriya-fitfam-$Stamp.tar.gz"
  $RemoteScript = "/tmp/bagriya-fitfam-deploy-$Stamp.sh"

  Write-Host "Uploading to $Target…" -ForegroundColor Cyan
  & scp.exe -i $KeyPath -o StrictHostKeyChecking=accept-new $Archive "${Target}:$RemoteArchive"
  if ($LASTEXITCODE -ne 0) { throw 'Application upload failed.' }
  & scp.exe -i $KeyPath -o StrictHostKeyChecking=accept-new $RemoteHelper "${Target}:$RemoteScript"
  if ($LASTEXITCODE -ne 0) { throw 'Deployment-helper upload failed.' }

  $SafeHost = $HostName.Replace("'", "''")
  $SafeLogin = $AdminLogin.Replace("'", "''")
  $SafeName = $AdminName.Replace("'", "''")
  $RemoteCommand = "chmod +x '$RemoteScript' && '$RemoteScript' '$RemoteArchive' '$SafeHost' '$SafeLogin' '$SafeName'; code=`$?; rm -f '$RemoteArchive' '$RemoteScript'; exit `$code"

  Write-Host 'Installing and starting the application…' -ForegroundColor Cyan
  & ssh.exe -tt -i $KeyPath -o StrictHostKeyChecking=accept-new $Target $RemoteCommand
  if ($LASTEXITCODE -ne 0) { throw 'Remote deployment failed. Review the output above.' }

  Write-Host "Checking http://$HostName/api/health from this computer…" -ForegroundColor Cyan
  try {
    $Health = Invoke-RestMethod -Uri "http://$HostName/api/health" -TimeoutSec 20
    Write-Host "Deployment complete — http://$HostName" -ForegroundColor Green
    $Health | ConvertTo-Json -Compress | Write-Host
  } catch {
    Write-Warning "The server is healthy internally, but the public check failed. In Oracle Cloud, allow inbound TCP 80 (and later 443) in the subnet Security List or NSG."
    Write-Host "Try opening: http://$HostName"
  }
} finally {
  if (Test-Path -LiteralPath $TempRoot) { Remove-Item -LiteralPath $TempRoot -Recurse -Force }
}
