<#
.SYNOPSIS
  Sets up slop-obliterator: builds the server, registers it with Claude Desktop
  and Claude Code, and publishes the repo to GitHub as private.

.DESCRIPTION
  Safe to re-run. Every step checks its own state first, the Claude Desktop
  config is backed up before it is touched, and existing MCP servers in that
  config are preserved.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\setup.ps1

.EXAMPLE
  # Just refresh the build, leave configs and git alone.
  .\setup.ps1 -SkipDesktop -SkipClaudeCode -SkipGitHub
#>

[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipBrowser,
  [switch]$SkipDesktop,
  [switch]$SkipClaudeCode,
  [switch]$SkipGitHub,
  [string]$RepoName,
  [switch]$Public
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $Root 'server'
$EntryPath = Join-Path $ServerDir 'dist\index.js'
if (-not $RepoName) { $RepoName = Split-Path -Leaf $Root }

function Step($text)  { Write-Host "`n=== $text" -ForegroundColor Cyan }
function Ok($text)    { Write-Host "  ok    $text" -ForegroundColor Green }
function Warn($text)  { Write-Host "  warn  $text" -ForegroundColor Yellow }
function Info($text)  { Write-Host "        $text" -ForegroundColor DarkGray }
function Have($name)  { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

Write-Host "slop-obliterator setup" -ForegroundColor White
Info $Root

# ---------------------------------------------------------------- prerequisites

Step 'Prerequisites'

if (-not (Have 'node')) { throw 'Node is not on PATH. Install Node 20 or newer: https://nodejs.org' }
$nodeMajor = [int]((node --version) -replace '^v(\d+)\..*', '$1')
if ($nodeMajor -lt 20) { throw "Node $nodeMajor found; this needs 20 or newer." }
Ok "node $(node --version)"

if (-not (Have 'npm')) { throw 'npm is not on PATH.' }
Ok "npm $(npm --version)"

if (Have 'git') { Ok "git $((git --version) -replace '^git version ','')" }
else { Warn 'git not found — the repo steps will be skipped.' }

# ------------------------------------------------------------------ build

if (-not $SkipInstall) {
  Step 'Install and build the server'

  # A previously interrupted install can leave half-written packages that npm
  # cannot clean up, which produces phantom type errors. Start from nothing.
  $modules = Join-Path $ServerDir 'node_modules'
  if (Test-Path $modules) {
    Info 'removing existing node_modules for a clean install'
    Remove-Item -Recurse -Force $modules
  }

  Push-Location $ServerDir
  try {
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
    Ok 'dependencies installed and server compiled'

    npm test
    if ($LASTEXITCODE -ne 0) { throw 'Self test failed — stopping before wiring anything up.' }
    Ok 'self test passed'
  }
  finally { Pop-Location }
}

if (-not (Test-Path $EntryPath)) {
  throw "Server entry point missing at $EntryPath. Run without -SkipInstall."
}

if (-not $SkipBrowser) {
  Step 'Chromium'
  Push-Location $ServerDir
  try {
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { Warn 'Chromium install failed — audits will not run until it succeeds.' }
    else {
      Ok 'chromium ready'
      npm run smoke
      if ($LASTEXITCODE -ne 0) { Warn 'End-to-end smoke test failed. The audit tools may not work.' }
      else { Ok 'end-to-end smoke test passed' }
    }
  }
  finally { Pop-Location }
}

# --------------------------------------------------------- claude desktop

if (-not $SkipDesktop) {
  Step 'Claude Desktop'

  # The packaged (MSIX) install and the classic install use different roots.
  # Update whichever exist; if neither does, create the packaged one.
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json'),
    (Join-Path $env:APPDATA 'Claude\claude_desktop_config.json')
  )

  $targets = @($candidates | Where-Object { Test-Path (Split-Path -Parent $_) })
  if ($targets.Count -eq 0) {
    Warn 'No Claude Desktop config directory found. Creating the packaged one.'
    $targets = @($candidates[0])
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $candidates[0]) | Out-Null
  }

  foreach ($configPath in $targets) {
    $config = [ordered]@{}

    if (Test-Path $configPath) {
      $backup = "$configPath.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
      Copy-Item $configPath $backup
      Info "backed up to $(Split-Path -Leaf $backup)"

      $existingText = (Get-Content $configPath -Raw).Trim()
      if ($existingText) {
        try { $config = $existingText | ConvertFrom-Json -ErrorAction Stop }
        catch { throw "$configPath is not valid JSON. Fix or delete it, then re-run. A backup is at $backup." }
      }
    }

    if ($config -isnot [System.Management.Automation.PSCustomObject]) {
      $config = [pscustomobject]@{}
    }

    if (-not ($config.PSObject.Properties.Name -contains 'mcpServers')) {
      $config | Add-Member -NotePropertyName 'mcpServers' -NotePropertyValue ([pscustomobject]@{}) -Force
    }

    $entry = [pscustomobject]@{
      command = 'node'
      args    = @(($EntryPath -replace '\\', '/'))
      env     = [pscustomobject]@{
        SLOP_ARTIFACT_DIR = ((Join-Path $Root '.slop-artifacts') -replace '\\', '/')
      }
    }

    $existingNames = @($config.mcpServers.PSObject.Properties.Name)
    $config.mcpServers | Add-Member -NotePropertyName 'slop-obliterator' -NotePropertyValue $entry -Force

    $config | ConvertTo-Json -Depth 12 | Set-Content -Path $configPath -Encoding UTF8

    $kept = @($existingNames | Where-Object { $_ -ne 'slop-obliterator' })
    Ok "registered in $configPath"
    if ($kept.Count -gt 0) { Info "preserved: $($kept -join ', ')" }
  }

  Info 'Restart Claude Desktop for this to take effect.'
}

# ------------------------------------------------------------ claude code

if (-not $SkipClaudeCode) {
  Step 'Claude Code'

  if (Have 'claude') {
    # User scope so the tools are available in every project, not just this one.
    claude mcp add slop-obliterator --scope user -- node ($EntryPath -replace '\\', '/') 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Ok 'server registered at user scope' }
    else { Warn 'claude mcp add failed (it may already be registered).' }

    Info 'For the skills and slash commands too, run these inside Claude Code:'
    Info "  /plugin marketplace add $Root"
    Info '  /plugin install slop-obliterator'
  }
  else {
    Warn 'claude CLI not on PATH — skipping.'
    Info 'The project-scoped .mcp.json in this folder still works when you open Claude Code here.'
  }
}

# ----------------------------------------------------------------- github

function Invoke-GitHubStep {
  Step 'Git and GitHub'

  $gitDir = Join-Path $Root '.git'

  # A repo created over a network or virtualised mount can be left holding lock
  # files and half-renamed temp objects, because the mount allows create and
  # rename but refuses unlink. The committed history is fine; the debris just
  # blocks the next command.
  if (Test-Path $gitDir) {
    $cleaned = $false

    $locks = @(Get-ChildItem -Path $gitDir -Recurse -Filter '*.lock' -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -in @('index.lock', 'HEAD.lock', 'config.lock', 'maintenance.lock') })
    foreach ($lock in $locks) {
      Remove-Item -Force $lock.FullName
      Info "cleared stale $($lock.Name)"
      $cleaned = $true
    }

    $temps = @(Get-ChildItem -Path (Join-Path $gitDir 'objects') -Recurse -Filter 'tmp_obj_*' -File -ErrorAction SilentlyContinue)
    if ($temps.Count -gt 0) {
      $temps | Remove-Item -Force
      Info "removed $($temps.Count) orphaned temp objects"
      $cleaned = $true
    }

    $quarantine = Join-Path $gitDir '.sandbox-debris'
    if (Test-Path $quarantine) {
      Remove-Item -Recurse -Force $quarantine
      Info 'removed quarantined debris'
      $cleaned = $true
    }

    if ($cleaned) { Ok 'repository debris cleaned' }
  }

  Push-Location $Root
  try {
    if (-not (Test-Path $gitDir)) {
      git init -b main | Out-Null
      Ok 'initialised repository'
    }

    git fsck --no-progress --connectivity-only 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Warn 'git fsck reported problems — inspect before pushing.' }
    else { Ok 'object database is intact' }

    git add -A
    if ($LASTEXITCODE -ne 0) { Warn 'git add failed.'; return }

    if (git diff --cached --name-only) {
      git commit -m 'chore: setup' | Out-Null
      Ok 'committed pending changes'
    }
    else { Info 'working tree already committed' }

    if (-not (Have 'gh')) {
      Warn 'GitHub CLI not installed — cannot create the remote.'
      Info 'Install it with `winget install GitHub.cli`, run `gh auth login`, then:'
      Info "  gh repo create $RepoName --private --source=. --remote=origin --push"
      return
    }

    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Warn 'GitHub CLI is not authenticated.'
      Info 'Run `gh auth login`, then re-run this script.'
      return
    }
    Ok 'gh authenticated'

    if ((git remote) -contains 'origin') {
      Info "origin is $(git remote get-url origin)"
      git push -u origin main
      if ($LASTEXITCODE -eq 0) { Ok 'pushed to origin' } else { Warn 'push failed.' }
    }
    else {
      $visibility = if ($Public) { '--public' } else { '--private' }
      gh repo create $RepoName $visibility --source=. --remote=origin --push
      if ($LASTEXITCODE -eq 0) { Ok "created $visibility repo '$RepoName' and pushed main" }
      else { Warn "gh repo create failed — '$RepoName' may already exist on your account." }
    }
  }
  finally { Pop-Location }
}

if (-not $SkipGitHub -and (Have 'git')) { Invoke-GitHubStep }

Step 'Done'
Info 'Restart Claude Desktop, then ask it to audit any page to confirm the tools are live.'
