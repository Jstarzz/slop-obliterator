<#
.SYNOPSIS
  Sets up slop-obliterator: builds the server, registers it with Claude Desktop
  and Claude Code, and publishes the repo to GitHub as private.

.DESCRIPTION
  Safe to re-run. Every step checks its own state first, the Claude Desktop
  config is backed up before it is touched, and existing MCP servers in that
  config are preserved.

  Keep this file ASCII-only. Windows PowerShell 5.1 decodes .ps1 as the system
  ANSI codepage unless there is a UTF-8 BOM, and a stray em dash becomes a
  smart quote that terminates a string early.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\setup.ps1

.EXAMPLE
  # Just refresh the build; leave configs and git alone.
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

# Deliberately NOT 'Stop'. Under Stop, Windows PowerShell turns anything a native
# command writes to stderr into a terminating error, and npm, git and gh all use
# stderr for ordinary progress output. Exit codes are checked explicitly instead,
# and the cmdlets that must not fail silently carry -ErrorAction Stop.
$ErrorActionPreference = 'Continue'

$Root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $Root 'server'
$EntryPath = Join-Path $ServerDir 'dist\index.js'
$EntryUrl  = $EntryPath -replace '\\', '/'
if (-not $RepoName) { $RepoName = Split-Path -Leaf $Root }

function Step($text) { Write-Host "`n=== $text" -ForegroundColor Cyan }
function Ok($text)   { Write-Host "  ok    $text" -ForegroundColor Green }
function Warn($text) { Write-Host "  warn  $text" -ForegroundColor Yellow }
function Info($text) { Write-Host "        $text" -ForegroundColor DarkGray }
function Fail($text) { Write-Host "  FAIL  $text" -ForegroundColor Red; exit 1 }
function Have($name) { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

# Runs a native command, swallowing its output, and returns the exit code.
function Invoke-Quiet {
  param([string]$Exe, [string[]]$CommandArgs)
  & $Exe @CommandArgs 2>&1 | Out-Null
  return $LASTEXITCODE
}

Write-Host 'slop-obliterator setup' -ForegroundColor White
Info $Root

# --------------------------------------------------------------- prerequisites

Step 'Prerequisites'

if (-not (Have 'node')) { Fail 'Node is not on PATH. Install Node 20 or newer from https://nodejs.org' }
$nodeVersion = (& node --version)
$nodeMajor = [int]($nodeVersion -replace '^v(\d+)\..*', '$1')
if ($nodeMajor -lt 20) { Fail "Node $nodeVersion found; this needs 20 or newer." }
Ok "node $nodeVersion"

if (-not (Have 'npm')) { Fail 'npm is not on PATH.' }
Ok "npm $(& npm --version)"

$hasGit = Have 'git'
if ($hasGit) { Ok ((& git --version) -replace '^git version ', 'git ') }
else { Warn 'git not found; the repo steps will be skipped.' }

# ----------------------------------------------------------------------- build

if (-not $SkipInstall) {
  Step 'Install and build the server'

  # A previously interrupted install can leave half-written packages that npm
  # cannot clean up, which shows up later as phantom type errors. Start clean.
  $modules = Join-Path $ServerDir 'node_modules'
  if (Test-Path $modules) {
    Info 'removing existing node_modules for a clean install'
    Remove-Item -Recurse -Force $modules -ErrorAction Stop
  }

  Push-Location $ServerDir
  try {
    & npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { Fail 'npm install failed.' }
    Ok 'dependencies installed and server compiled'

    & npm test
    if ($LASTEXITCODE -ne 0) { Fail 'Self test failed; stopping before wiring anything up.' }
    Ok 'self test passed'
  }
  finally { Pop-Location }
}

if (-not (Test-Path $EntryPath)) {
  Fail "Server entry point missing at $EntryPath. Re-run without -SkipInstall."
}

if (-not $SkipBrowser) {
  Step 'Chromium'
  Push-Location $ServerDir
  try {
    & npx playwright install chromium
    if ($LASTEXITCODE -ne 0) {
      Warn 'Chromium install failed; the audit tools will not run until it succeeds.'
    }
    else {
      Ok 'chromium ready'
      & npm run smoke
      if ($LASTEXITCODE -ne 0) { Warn 'End-to-end smoke test failed. The audit tools may not work.' }
      else { Ok 'end-to-end smoke test passed' }
    }
  }
  finally { Pop-Location }
}

# -------------------------------------------------------------- claude desktop

if (-not $SkipDesktop) {
  Step 'Claude Desktop'

  # The packaged (Store/MSIX) install and the classic install use different
  # roots. Update whichever exist; if neither does, create the packaged one.
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json'),
    (Join-Path $env:APPDATA 'Claude\claude_desktop_config.json')
  )

  $targets = @($candidates | Where-Object { Test-Path (Split-Path -Parent $_) })
  if ($targets.Count -eq 0) {
    Warn 'No Claude Desktop config directory found. Creating the packaged one.'
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $candidates[0]) -ErrorAction Stop | Out-Null
    $targets = @($candidates[0])
  }

  foreach ($configPath in $targets) {
    $config = $null

    if (Test-Path $configPath) {
      $backup = "$configPath.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
      Copy-Item $configPath $backup -ErrorAction Stop
      Info "backed up to $(Split-Path -Leaf $backup)"

      $existingText = (Get-Content $configPath -Raw -ErrorAction Stop)
      if ($existingText -and $existingText.Trim()) {
        try {
          $config = $existingText | ConvertFrom-Json -ErrorAction Stop
        }
        catch {
          Fail "$configPath is not valid JSON. Fix or delete it, then re-run. A backup is at $backup"
        }
      }
    }

    # ConvertFrom-Json yields a PSCustomObject for an object, but an array or a
    # bare string for anything else. Only the object case is usable.
    if ($null -eq $config -or $config -isnot [System.Management.Automation.PSCustomObject]) {
      $config = New-Object psobject
    }

    if (-not ($config.PSObject.Properties.Name -contains 'mcpServers')) {
      Add-Member -InputObject $config -NotePropertyName 'mcpServers' -NotePropertyValue (New-Object psobject) -Force
    }

    $servers = $config.mcpServers
    $existingNames = @($servers.PSObject.Properties.Name)

    $entry = New-Object psobject
    Add-Member -InputObject $entry -NotePropertyName 'command' -NotePropertyValue 'node'
    Add-Member -InputObject $entry -NotePropertyName 'args' -NotePropertyValue @($EntryUrl)

    $env0 = New-Object psobject
    Add-Member -InputObject $env0 -NotePropertyName 'SLOP_ARTIFACT_DIR' `
      -NotePropertyValue ((Join-Path $Root '.slop-artifacts') -replace '\\', '/')
    Add-Member -InputObject $entry -NotePropertyName 'env' -NotePropertyValue $env0

    Add-Member -InputObject $servers -NotePropertyName 'slop-obliterator' -NotePropertyValue $entry -Force

    # Set-Content -Encoding UTF8 writes a BOM on Windows PowerShell 5.1, which
    # some JSON parsers reject. Write it without one.
    $json = $config | ConvertTo-Json -Depth 12
    [System.IO.File]::WriteAllText($configPath, $json, (New-Object System.Text.UTF8Encoding $false))

    # Read it back before claiming success.
    try { Get-Content $configPath -Raw | ConvertFrom-Json -ErrorAction Stop | Out-Null }
    catch { Fail "Wrote $configPath but it no longer parses as JSON. Restore the .bak file beside it." }

    Ok "registered in $configPath"
    $kept = @($existingNames | Where-Object { $_ -ne 'slop-obliterator' })
    if ($kept.Count -gt 0) { Info "preserved: $($kept -join ', ')" }
  }

  Info 'Restart Claude Desktop for this to take effect.'
}

# ----------------------------------------------------------------- claude code

if (-not $SkipClaudeCode) {
  Step 'Claude Code'

  if (Have 'claude') {
    # User scope, so the tools are available in every project rather than only
    # when this folder happens to be the working directory.
    $code = Invoke-Quiet 'claude' @('mcp', 'add', 'slop-obliterator', '--scope', 'user', '--', 'node', $EntryUrl)
    if ($code -eq 0) { Ok 'server registered at user scope' }
    else { Warn 'claude mcp add did not succeed; it may already be registered.' }

    Info 'For the skills and slash commands too, run these inside Claude Code:'
    Info "  /plugin marketplace add $Root"
    Info '  /plugin install slop-obliterator'
  }
  else {
    Warn 'claude CLI not on PATH; skipping.'
    Info 'The project-scoped .mcp.json in this folder still works when you open Claude Code here.'
  }
}

# ---------------------------------------------------------------------- github

function Invoke-GitHubStep {
  Step 'Git and GitHub'

  $gitDir = Join-Path $Root '.git'

  # A repo written over a virtualised or network mount can be left holding lock
  # files and half-renamed temp objects, because such mounts allow create and
  # rename but refuse unlink. The committed history is fine; the debris just
  # blocks the next command.
  if (Test-Path $gitDir) {
    $cleaned = $false

    $lockNames = @('index.lock', 'HEAD.lock', 'config.lock', 'maintenance.lock')
    $locks = @(Get-ChildItem -Path $gitDir -Recurse -Filter '*.lock' -File -ErrorAction SilentlyContinue |
      Where-Object { $lockNames -contains $_.Name })
    foreach ($lock in $locks) {
      Remove-Item -Force $lock.FullName -ErrorAction SilentlyContinue
      Info "cleared stale $($lock.Name)"
      $cleaned = $true
    }

    $objectsDir = Join-Path $gitDir 'objects'
    $temps = @(Get-ChildItem -Path $objectsDir -Recurse -Filter 'tmp_obj_*' -File -ErrorAction SilentlyContinue)
    if ($temps.Count -gt 0) {
      $temps | Remove-Item -Force -ErrorAction SilentlyContinue
      Info "removed $($temps.Count) orphaned temp objects"
      $cleaned = $true
    }

    $quarantine = Join-Path $gitDir '.sandbox-debris'
    if (Test-Path $quarantine) {
      Remove-Item -Recurse -Force $quarantine -ErrorAction SilentlyContinue
      Info 'removed quarantined debris'
      $cleaned = $true
    }

    if ($cleaned) { Ok 'repository debris cleaned' }
  }

  Push-Location $Root
  try {
    if (-not (Test-Path $gitDir)) {
      $code = Invoke-Quiet 'git' @('init', '-b', 'main')
      if ($code -ne 0) { Warn 'git init failed.'; return }
      Ok 'initialised repository'
    }

    $code = Invoke-Quiet 'git' @('fsck', '--no-progress', '--connectivity-only')
    if ($code -ne 0) { Warn 'git fsck reported problems; inspect before pushing.' }
    else { Ok 'object database is intact' }

    $code = Invoke-Quiet 'git' @('add', '-A')
    if ($code -ne 0) { Warn 'git add failed.'; return }

    $pending = & git diff --cached --name-only
    if ($pending) {
      $code = Invoke-Quiet 'git' @('commit', '-m', 'chore: setup')
      if ($code -eq 0) { Ok "committed $(@($pending).Count) pending change(s)" }
      else { Warn 'git commit failed.'; return }
    }
    else { Info 'working tree already committed' }

    if (-not (Have 'gh')) {
      Warn 'GitHub CLI not installed, so the remote cannot be created here.'
      Info 'Install it with:  winget install GitHub.cli'
      Info 'Then run:         gh auth login'
      Info "Then run:         gh repo create $RepoName --private --source=. --remote=origin --push"
      return
    }

    if ((Invoke-Quiet 'gh' @('auth', 'status')) -ne 0) {
      Warn 'GitHub CLI is not authenticated.'
      Info 'Run  gh auth login  then re-run this script.'
      return
    }
    Ok 'gh authenticated'

    $remotes = @(& git remote)
    if ($remotes -contains 'origin') {
      Info "origin is $(& git remote get-url origin)"
      & git push -u origin main
      if ($LASTEXITCODE -eq 0) { Ok 'pushed to origin' } else { Warn 'push failed.' }
    }
    else {
      $visibility = if ($Public) { '--public' } else { '--private' }
      & gh repo create $RepoName $visibility --source=. --remote=origin --push
      if ($LASTEXITCODE -eq 0) { Ok "created $visibility repo '$RepoName' and pushed main" }
      else { Warn "gh repo create failed. '$RepoName' may already exist on your account." }
    }
  }
  finally { Pop-Location }
}

if (-not $SkipGitHub -and $hasGit) { Invoke-GitHubStep }

Step 'Done'
Info 'Restart Claude Desktop, then ask it to audit any page to confirm the tools are live.'
