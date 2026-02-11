# PowerShell development script for llama.cpp webui
# 
# This script starts the webui development servers (Storybook and Vite).
# Note: You need to start llama-server separately.

# Move to webui directory if not already there
$WebuiDir = $PSScriptRoot
if ($null -eq $WebuiDir) { $WebuiDir = "." }
Push-Location "$WebuiDir\.."

# Project root
$ProjectRoot = (Get-Item "$WebuiDir\..\..\..").FullName

# Check for required hooks
$HooksMissing = $false
if (-not (Test-Path "$ProjectRoot\.git\hooks\pre-commit") -or 
    -not (Test-Path "$ProjectRoot\.git\hooks\pre-push") -or 
    -not (Test-Path "$ProjectRoot\.git\hooks\post-push")) {
    $HooksMissing = $true
}

if ($HooksMissing) {
    Write-Host "🔧 Git hooks missing." -ForegroundColor Yellow
    Write-Host "📝 Note: You can install them by running bash scripts/install-git-hooks.sh if you have git bash." -ForegroundColor Gray
} else {
    Write-Host "✅ Git hooks already installed" -ForegroundColor Green
}

Write-Host "🚀 Starting development servers..." -ForegroundColor Cyan
Write-Host "📝 Note: Make sure to start llama-server separately if needed" -ForegroundColor Gray

# Set environment variable for insecure http parser
$env:NODE_OPTIONS = "--insecure-http-parser"

# Start Storybook and Vite
# Using Start-Process to keep them in separate windows or background
# Alternatively, we can use Jobs, but Start-Process is easier for debugging logs

$StorybookProcess = Start-Process npx -ArgumentList "storybook dev -p 6006 --ci" -PassThru -NoNewWindow
$ViteProcess = Start-Process npx -ArgumentList "vite dev --host 0.0.0.0" -PassThru -NoNewWindow

Write-Host "🖥️  Servers are running (Storybook on 6006, Vite on 5173)." -ForegroundColor Green
Write-Host "⌨️  Press Ctrl+C to stop (though you might need to kill the processes manually if they don't respond)." -ForegroundColor Gray

try {
    # Wait for processes
    Wait-Process -Id $StorybookProcess.Id, $ViteProcess.Id
} catch {
    Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
    Stop-Process -Id $StorybookProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $ViteProcess.Id -ErrorAction SilentlyContinue
} finally {
    Pop-Location
}
