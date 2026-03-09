#Requires -Version 5.1
<#
.SYNOPSIS
    ClaudeNest Agent Installer for Windows.

.DESCRIPTION
    Installs Node.js (if needed) and the @claudenest/agent npm package.

.PARAMETER Server
    ClaudeNest server URL. Default: https://api.claudenest.io

.PARAMETER NoPair
    Skip the pairing step.

.EXAMPLE
    irm https://claudenest.io/install-agent.ps1 | iex
    .\install-agent.ps1 -Server https://my-server.com
#>

[CmdletBinding()]
param(
    [string]$Server = "https://api.claudenest.io",
    [switch]$NoPair
)

$ErrorActionPreference = "Stop"

$PACKAGE_NAME = "@claudenest/agent"
$MIN_NODE_VERSION = 20

# ============================================
# Helpers
# ============================================
function Write-Step($msg) { Write-Host "`n-> $msg" -ForegroundColor Magenta }
function Write-Info($msg) { Write-Host "[info] $msg" -ForegroundColor Blue }
function Write-Ok($msg)   { Write-Host "[ok] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[warn] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[error] $msg" -ForegroundColor Red }

function Test-Command($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Get-NodeMajor {
    try {
        $ver = (node --version) -replace '^v', ''
        return [int]($ver.Split('.')[0])
    } catch {
        return 0
    }
}

# ============================================
# Banner
# ============================================
function Show-Banner {
    Write-Host @"

   _____ _                 _       _   _           _
  / ____| |               | |     | \ | |         | |
 | |    | | __ _ _   _  __| | ___ |  \| | ___  ___| |_
 | |    | |/ _` | | | |/ _` |/ _ \| . ` |/ _ \/ __| __|
 | |____| | (_| | |_| | (_| |  __/| |\  |  __/\__ \ |_
  \_____|_|\__,_|\__,_|\__,_|\___||_| \_|\___||___/\__|
                                           Agent Installer

"@ -ForegroundColor Magenta
}

# ============================================
# Node.js Installation
# ============================================
function Install-NodeJS {
    Write-Step "Installing Node.js $MIN_NODE_VERSION..."

    if (Test-Command winget) {
        Write-Info "Using winget..."
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                     [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    elseif (Test-Command choco) {
        Write-Info "Using Chocolatey..."
        choco install nodejs-lts -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                     [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    else {
        Write-Warn "No package manager found. Installing via official installer..."
        $installerUrl = "https://nodejs.org/dist/latest-v${MIN_NODE_VERSION}.x/node-v${MIN_NODE_VERSION}.0.0-x64.msi"
        $installerPath = "$env:TEMP\nodejs-installer.msi"

        Write-Info "Downloading Node.js installer..."
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing

        Write-Info "Running installer (may require elevation)..."
        Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn" -Wait -Verb RunAs

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                     [System.Environment]::GetEnvironmentVariable("Path", "User")

        Remove-Item $installerPath -ErrorAction SilentlyContinue
    }
}

# ============================================
# Build Tools
# ============================================
function Install-BuildTools {
    Write-Step "Checking build tools for native modules..."

    # node-gyp needs Python and Visual C++ Build Tools
    if (-not (Test-Command python) -and -not (Test-Command python3)) {
        Write-Info "Installing windows-build-tools via npm (this may take a while)..."
        npm install --global windows-build-tools 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "windows-build-tools failed. Trying npm config approach..."
            npm config set msvs_version 2022
        }
    } else {
        Write-Ok "Python found"
    }
}

# ============================================
# Main
# ============================================
function Main {
    Show-Banner

    Write-Info "Detected: Windows $([System.Environment]::OSVersion.Version)"
    Write-Host ""

    # Step 1: Check / Install Node.js
    Write-Step "Checking Node.js..."

    if (Test-Command node) {
        $nodeMajor = Get-NodeMajor
        if ($nodeMajor -ge $MIN_NODE_VERSION) {
            Write-Ok "Node.js v$(node --version) found (>= $MIN_NODE_VERSION required)"
        } else {
            Write-Warn "Node.js v$(node --version) found, but v$MIN_NODE_VERSION+ required"
            Install-NodeJS
        }
    } else {
        Write-Info "Node.js not found"
        Install-NodeJS
    }

    # Verify
    if (-not (Test-Command node)) {
        Write-Err "Node.js installation failed. Please install Node.js $MIN_NODE_VERSION+ manually."
        Write-Err "Visit: https://nodejs.org/"
        exit 1
    }

    # Step 2: Build tools
    Install-BuildTools

    # Step 3: Install agent
    Write-Step "Installing $PACKAGE_NAME..."

    if (Test-Command claudenest-agent) {
        $currentVer = claudenest-agent --version 2>$null
        Write-Info "Upgrading from v$currentVer..."
    }

    npm install -g "$PACKAGE_NAME"

    if (-not (Test-Command claudenest-agent)) {
        # Refresh PATH one more time
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                     [System.Environment]::GetEnvironmentVariable("Path", "User")
    }

    if (-not (Test-Command claudenest-agent)) {
        Write-Err "Installation failed. 'claudenest-agent' command not found."
        Write-Err "Try: npm install -g $PACKAGE_NAME"
        exit 1
    }

    $installedVer = claudenest-agent --version 2>$null
    Write-Ok "ClaudeNest Agent v$installedVer installed"

    # Step 4: Pair
    if (-not $NoPair) {
        Write-Step "Pairing with ClaudeNest server..."
        Write-Host ""
        Write-Info "Server: $Server"
        Write-Host ""

        $answer = Read-Host "Pair this machine now? [Y/n]"
        if ($answer -eq '' -or $answer -match '^[Yy]') {
            claudenest-agent pair --server $Server
        } else {
            Write-Info "Skipped. Pair later with: claudenest-agent pair"
        }
    }

    # Done
    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Quick start:"
    Write-Host "    claudenest-agent pair      # Pair with your account"
    Write-Host "    claudenest-agent start     # Start the agent"
    Write-Host "    claudenest-agent status    # Check status"
    Write-Host ""
    Write-Host "  Documentation: https://docs.claudenest.io" -ForegroundColor Cyan
    Write-Host ""
}

Main
