param(
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"
$ProjectPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectPath

$branch = (git branch --show-current).Trim()

if ($branch -ne "main") {
    throw "Release publishing must run from the main branch."
}

$origin = (git remote get-url origin).Trim()

if ($origin -notmatch 'github\.com[:/]meshahid973/typely(?:\.git)?$') {
    throw "The origin remote is not meshahid973/typely."
}

$packageVersion = (Get-Content ".\package.json" | ConvertFrom-Json).version
$tauriVersion = (Get-Content ".\src-tauri\tauri.conf.json" | ConvertFrom-Json).version
$cargoVersion = (
    Select-String `
        -Path ".\src-tauri\Cargo.toml" `
        -Pattern '^version\s*=\s*"([^"]+)"'
).Matches[0].Groups[1].Value
$tag = "v$packageVersion"

if (-not $CommitMessage) {
    $CommitMessage = "release: Typely $tag"
}

if ($packageVersion -ne $tauriVersion -or $packageVersion -ne $cargoVersion) {
    throw "package.json, tauri.conf.json and Cargo.toml versions must match."
}

$localTag = git tag --list $tag

if ($localTag) {
    throw "Tag $tag already exists locally."
}

$remoteTag = git ls-remote --tags origin "refs/tags/$tag"

if ($remoteTag) {
    throw "Tag $tag already exists on GitHub."
}

$trackedSecrets = git ls-files -- ".env" "cloudflare/typely-api/.dev.vars"

if ($trackedSecrets) {
    throw "A private environment or secret file is tracked by Git."
}

pnpm format
pnpm check
pnpm build
cargo fmt --manifest-path ".\src-tauri\Cargo.toml" --check
cargo clippy --manifest-path ".\src-tauri\Cargo.toml" --all-targets -- -D warnings
cargo test --manifest-path ".\src-tauri\Cargo.toml"
git diff --check

git add -A

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

git push origin main
git tag -a $tag -m "Typely $tag"
git push origin $tag

Write-Host ""
Write-Host "Code pushed and release build started."
Write-Host "Actions: https://github.com/meshahid973/typely/actions"
Write-Host "Release: https://github.com/meshahid973/typely/releases"
