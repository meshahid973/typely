param(
    [string]$CommitMessage = "fix: normalize repository line endings"
)

$ErrorActionPreference = "Stop"
$ProjectPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectPath

$branch = (git branch --show-current).Trim()

if ($branch -ne "main") {
    throw "Run this repair from the main branch."
}

$origin = (git remote get-url origin).Trim()

if ($origin -notmatch 'github\.com[:/]meshahid973/typely(?:\.git)?$') {
    throw "The origin remote is not meshahid973/typely."
}

$trackedSecrets = git ls-files -- ".env" "cloudflare/typely-api/.dev.vars"

if ($trackedSecrets) {
    throw "A private environment or secret file is tracked by Git."
}

$packageVersion = (Get-Content ".\package.json" | ConvertFrom-Json).version
$tauriVersion = (Get-Content ".\src-tauri\tauri.conf.json" | ConvertFrom-Json).version
$cargoVersion = (
    Select-String `
        -Path ".\src-tauri\Cargo.toml" `
        -Pattern '^version\s*=\s*"([^"]+)"'
).Matches[0].Groups[1].Value

if ($packageVersion -ne $tauriVersion -or $packageVersion -ne $cargoVersion) {
    throw "package.json, tauri.conf.json and Cargo.toml versions must match."
}

$tag = "v$packageVersion"

git config core.autocrlf false

Write-Host ""
Write-Host "Formatting and normalizing every tracked text file to LF..."
pnpm format
git add --renormalize .
git add -A

Write-Host ""
Write-Host "Running the complete release checks..."
pnpm check
pnpm build
cargo fmt --manifest-path ".\src-tauri\Cargo.toml" --check
cargo clippy --manifest-path ".\src-tauri\Cargo.toml" --all-targets -- -D warnings
cargo test --manifest-path ".\src-tauri\Cargo.toml"
git diff --check
git diff --cached --check

$stagedSecrets = git diff --cached --name-only |
    Select-String -Pattern '(^|/)\.env$|(^|/)\.dev\.vars$'

if ($stagedSecrets) {
    git reset
    throw "A private environment or secret file was staged. Nothing was pushed."
}

git diff --cached --quiet

if ($LASTEXITCODE -ne 0) {
    git commit -m $CommitMessage
}

Write-Host ""
Write-Host "Pushing the repaired main branch..."
git push origin main

$localTag = git tag --list $tag

if ($localTag) {
    Write-Host "Removing the failed local tag $tag..."
    git tag -d $tag
}

$remoteTag = git ls-remote --tags origin "refs/tags/$tag"

if ($remoteTag) {
    Write-Host "Removing the failed remote tag $tag..."
    git push origin ":refs/tags/$tag"
}

Write-Host "Creating the repaired release tag $tag..."
git tag -a $tag -m "Typely $tag"
git push origin $tag

Write-Host ""
Write-Host "The repaired release workflow has started."
Write-Host "Actions: https://github.com/meshahid973/typely/actions"
Write-Host "Releases: https://github.com/meshahid973/typely/releases"
