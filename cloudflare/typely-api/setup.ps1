$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

function Get-NativeCommandPath {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Names
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue

        if ($command) {
            return $command.Source
        }
    }

    throw "Could not find any of these commands: $($Names -join ', ')"
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$Arguments = @(),

        [switch]$Capture,
        [switch]$Quiet,
        [switch]$AllowFailure
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $stderrPath = $null

    try {
        $stdoutLines = @()
        $stderrLines = @()

        if ($Capture) {
            $stderrPath = Join-Path $env:TEMP "typely-native-$([Guid]::NewGuid().ToString('N')).log"
            $stdoutLines = @(& $FilePath @Arguments 2> $stderrPath)
            $exitCode = $LASTEXITCODE

            if (Test-Path -LiteralPath $stderrPath) {
                $stderrLines = @(Get-Content -LiteralPath $stderrPath -ErrorAction SilentlyContinue)
            }

            if (-not $Quiet) {
                foreach ($line in $stdoutLines) {
                    Write-Host ([string]$line)
                }

                foreach ($line in $stderrLines) {
                    Write-Host ([string]$line)
                }
            }
        }
        else {
            & $FilePath @Arguments
            $exitCode = $LASTEXITCODE
        }

        if ($null -eq $exitCode) {
            $exitCode = 0
        }

        if ($exitCode -ne 0 -and -not $AllowFailure) {
            throw "$Name failed with exit code $exitCode."
        }

        return [PSCustomObject]@{
            ExitCode = [int]$exitCode
            StdOut = @($stdoutLines | ForEach-Object { [string]$_ })
            StdErr = @($stderrLines | ForEach-Object { [string]$_ })
        }
    }
    finally {
        $ErrorActionPreference = $previousPreference

        if ($stderrPath) {
            Remove-Item -LiteralPath $stderrPath -Force -ErrorAction SilentlyContinue
        }
    }
}


function Invoke-NativeCommandWithInput {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$InputText
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"

    try {
        $InputText | & $FilePath @Arguments
        $exitCode = $LASTEXITCODE

        if ($null -eq $exitCode) {
            $exitCode = 0
        }

        if ($exitCode -ne 0) {
            throw "$Name failed with exit code $exitCode."
        }
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Write-Utf8WithoutBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Text
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Text, $encoding)
}

function ConvertFrom-WranglerJson {
    param(
        [string[]]$Lines
    )

    $text = ($Lines -join "`n").Trim()

    if (-not $text) {
        return $null
    }

    try {
        return $text | ConvertFrom-Json
    }
    catch {
    }

    $arrayStart = $text.IndexOf("[")
    $objectStart = $text.IndexOf("{")
    $start = -1
    $end = -1

    if ($arrayStart -ge 0 -and ($objectStart -lt 0 -or $arrayStart -lt $objectStart)) {
        $start = $arrayStart
        $end = $text.LastIndexOf("]")
    }
    elseif ($objectStart -ge 0) {
        $start = $objectStart
        $end = $text.LastIndexOf("}")
    }

    if ($start -lt 0 -or $end -le $start) {
        return $null
    }

    try {
        return $text.Substring($start, $end - $start + 1) | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

function Get-ObjectPropertyValue {
    param(
        [object]$Object,
        [string[]]$Names
    )

    if ($null -eq $Object) {
        return $null
    }

    foreach ($name in $Names) {
        $property = $Object.PSObject.Properties[$name]

        if ($property -and $null -ne $property.Value) {
            return $property.Value
        }
    }

    return $null
}

function Find-DatabaseIdInValue {
    param(
        [object]$Value,
        [string]$DatabaseName,
        [bool]$RequireMatchingName
    )

    if ($null -eq $Value) {
        return $null
    }

    if ($Value -is [System.Collections.IEnumerable] -and
        -not ($Value -is [string]) -and
        -not ($Value -is [System.Management.Automation.PSCustomObject])) {
        foreach ($item in $Value) {
            $found = Find-DatabaseIdInValue `
                -Value $item `
                -DatabaseName $DatabaseName `
                -RequireMatchingName $RequireMatchingName

            if ($found) {
                return $found
            }
        }

        return $null
    }

    $name = [string](Get-ObjectPropertyValue `
        -Object $Value `
        -Names @("name", "database_name", "databaseName"))

    $id = [string](Get-ObjectPropertyValue `
        -Object $Value `
        -Names @("uuid", "database_id", "databaseId", "id"))

    $nameMatches = $name -and $name.Equals($DatabaseName, [StringComparison]::OrdinalIgnoreCase)

    if ($id -and (($RequireMatchingName -and $nameMatches) -or (-not $RequireMatchingName))) {
        return $id
    }

    foreach ($property in $Value.PSObject.Properties) {
        if ($null -eq $property.Value -or $property.Value -is [string]) {
            continue
        }

        $found = Find-DatabaseIdInValue `
            -Value $property.Value `
            -DatabaseName $DatabaseName `
            -RequireMatchingName $RequireMatchingName

        if ($found) {
            return $found
        }
    }

    return $null
}

function Get-DatabaseIdFromText {
    param(
        [string]$Text
    )

    if (-not $Text) {
        return $null
    }

    $databaseIdMatch = [regex]::Match(
        $Text,
        '(?im)database_id\s*[=:]\s*["'']?(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
    )

    if ($databaseIdMatch.Success) {
        return $databaseIdMatch.Groups["id"].Value
    }

    $uuidMatch = [regex]::Match(
        $Text,
        '(?i)\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b'
    )

    if ($uuidMatch.Success) {
        return $uuidMatch.Value
    }

    return $null
}

function Get-DatabaseId {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DatabaseName,

        [Parameter(Mandatory = $true)]
        [string]$NpxPath
    )

    $listResult = Invoke-NativeCommand `
        -Name "D1 database list" `
        -FilePath $NpxPath `
        -Arguments @("wrangler", "d1", "list", "--json") `
        -Capture `
        -Quiet `
        -AllowFailure

    if ($listResult.ExitCode -eq 0) {
        $listJson = ConvertFrom-WranglerJson -Lines $listResult.StdOut
        $listId = Find-DatabaseIdInValue `
            -Value $listJson `
            -DatabaseName $DatabaseName `
            -RequireMatchingName $true

        if ($listId) {
            return $listId
        }
    }

    $infoJsonResult = Invoke-NativeCommand `
        -Name "D1 database JSON lookup" `
        -FilePath $NpxPath `
        -Arguments @("wrangler", "d1", "info", $DatabaseName, "--json") `
        -Capture `
        -Quiet `
        -AllowFailure

    if ($infoJsonResult.ExitCode -eq 0) {
        $infoJson = ConvertFrom-WranglerJson -Lines $infoJsonResult.StdOut
        $infoId = Find-DatabaseIdInValue `
            -Value $infoJson `
            -DatabaseName $DatabaseName `
            -RequireMatchingName $false

        if ($infoId) {
            return $infoId
        }
    }

    $infoTextResult = Invoke-NativeCommand `
        -Name "D1 database text lookup" `
        -FilePath $NpxPath `
        -Arguments @("wrangler", "d1", "info", $DatabaseName) `
        -Capture `
        -Quiet `
        -AllowFailure

    $infoText = (@($infoTextResult.StdOut) + @($infoTextResult.StdErr)) -join "`n"
    return Get-DatabaseIdFromText -Text $infoText
}

function New-RandomSecret {
    $bytes = New-Object byte[] 48
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $generator.GetBytes($bytes)
        return [Convert]::ToBase64String($bytes)
    }
    finally {
        $generator.Dispose()
    }
}

$npmPath = Get-NativeCommandPath -Names @("npm.cmd", "npm")
$npxPath = Get-NativeCommandPath -Names @("npx.cmd", "npx")

Invoke-NativeCommand `
    -Name "Worker dependency installation" `
    -FilePath $npmPath `
    -Arguments @("install") | Out-Null

$configPath = Join-Path $PSScriptRoot "wrangler.jsonc"
$configText = Get-Content -LiteralPath $configPath -Raw
$config = $configText | ConvertFrom-Json

if ($config.PSObject.Properties["secrets"]) {
    $config.PSObject.Properties.Remove("secrets")
    $cleanConfigJson = $config | ConvertTo-Json -Depth 20
    Write-Utf8WithoutBom -Path $configPath -Text $cleanConfigJson
}

$whoAmI = Invoke-NativeCommand `
    -Name "Cloudflare authentication check" `
    -FilePath $npxPath `
    -Arguments @("wrangler", "whoami") `
    -Capture `
    -Quiet `
    -AllowFailure

if ($whoAmI.ExitCode -ne 0) {
    Write-Host "Cloudflare login is required. Your browser will open now."

    Invoke-NativeCommand `
        -Name "Cloudflare login" `
        -FilePath $npxPath `
        -Arguments @("wrangler", "login") | Out-Null
}

$database = @($config.d1_databases)[0]
$databaseName = [string]$database.database_name

if (-not $databaseName) {
    throw "No D1 database name was found in wrangler.jsonc."
}

$databaseId = [string]$database.database_id
$needsDatabaseId = -not $databaseId -or $databaseId -eq "REPLACE_WITH_D1_DATABASE_ID"

if ($needsDatabaseId) {
    $databaseId = Get-DatabaseId -DatabaseName $databaseName -NpxPath $npxPath

    if (-not $databaseId) {
        Write-Host "Creating D1 database '$databaseName'..."

        $createResult = Invoke-NativeCommand `
            -Name "D1 database creation" `
            -FilePath $npxPath `
            -Arguments @("wrangler", "d1", "create", $databaseName) `
            -Capture `
            -AllowFailure

        $createText = (@($createResult.StdOut) + @($createResult.StdErr)) -join "`n"
        $databaseId = Get-DatabaseIdFromText -Text $createText

        if (-not $databaseId) {
            for ($attempt = 1; $attempt -le 5 -and -not $databaseId; $attempt++) {
                Start-Sleep -Seconds 2
                $databaseId = Get-DatabaseId -DatabaseName $databaseName -NpxPath $npxPath
            }
        }
    }

    if (-not $databaseId) {
        Write-Host ""
        Write-Host "Wrangler could not return the database ID automatically."
        Write-Host "Run this diagnostic command and copy its output:"
        Write-Host "npx wrangler d1 list --json"
        throw "The D1 database exists, but its database ID could not be read."
    }

    $database.database_id = $databaseId
    $json = $config | ConvertTo-Json -Depth 20
    Write-Utf8WithoutBom -Path $configPath -Text $json

    Write-Host "D1 database configured: $databaseId"
}
else {
    Write-Host "D1 database is already configured: $databaseId"
}

Write-Host "Applying remote D1 migrations..."
Write-Host "If Wrangler asks for confirmation, type y and press Enter."

Invoke-NativeCommand `
    -Name "D1 migration" `
    -FilePath $npxPath `
    -Arguments @("wrangler", "d1", "migrations", "apply", $databaseName, "--remote") | Out-Null

$localSecretsPath = Join-Path $PSScriptRoot ".dev.vars"
$passwordPepper = $null
$rateLimitSecret = $null

if (Test-Path -LiteralPath $localSecretsPath -PathType Leaf) {
    foreach ($line in Get-Content -LiteralPath $localSecretsPath) {
        if ($line -match "^PASSWORD_PEPPER=(.+)$") {
            $passwordPepper = $Matches[1].Trim()
        }
        elseif ($line -match "^RATE_LIMIT_SECRET=(.+)$") {
            $rateLimitSecret = $Matches[1].Trim()
        }
    }

    if (-not $passwordPepper -or -not $rateLimitSecret) {
        throw "The existing .dev.vars file is incomplete. Restore it from backup instead of rotating account secrets."
    }

    Write-Host "Reusing the existing local Worker secrets."
}
else {
    $secretListResult = Invoke-NativeCommand `
        -Name "Worker secret check" `
        -FilePath $npxPath `
        -Arguments @("wrangler", "secret", "list", "--format", "json") `
        -Capture `
        -Quiet `
        -AllowFailure

    $secretListText = (@($secretListResult.StdOut) + @($secretListResult.StdErr)) -join "`n"

    if ($secretListResult.ExitCode -eq 0 -and
        ($secretListText -match '"PASSWORD_PEPPER"' -or $secretListText -match '"RATE_LIMIT_SECRET"')) {
        throw "Remote account secrets already exist, but .dev.vars is missing. Do not generate replacements because that would invalidate existing passwords. Restore the original .dev.vars file."
    }

    $passwordPepper = New-RandomSecret
    $rateLimitSecret = New-RandomSecret

    $localSecretsText = @(
        "PASSWORD_PEPPER=$passwordPepper"
        "RATE_LIMIT_SECRET=$rateLimitSecret"
    ) -join "`n"

    Write-Utf8WithoutBom -Path $localSecretsPath -Text $localSecretsText
    Write-Host "Created persistent local Worker secrets at: $localSecretsPath"
}

Write-Host "Deploying the Worker code..."
$initialDeployResult = Invoke-NativeCommand `
    -Name "Initial Cloudflare Worker deployment" `
    -FilePath $npxPath `
    -Arguments @("wrangler", "deploy") `
    -Capture

Write-Host "Uploading PASSWORD_PEPPER..."
Invoke-NativeCommandWithInput `
    -Name "PASSWORD_PEPPER upload" `
    -FilePath $npxPath `
    -Arguments @("wrangler", "secret", "put", "PASSWORD_PEPPER") `
    -InputText $passwordPepper

Write-Host "Uploading RATE_LIMIT_SECRET..."
Invoke-NativeCommandWithInput `
    -Name "RATE_LIMIT_SECRET upload" `
    -FilePath $npxPath `
    -Arguments @("wrangler", "secret", "put", "RATE_LIMIT_SECRET") `
    -InputText $rateLimitSecret

Write-Host "Deploying the final Worker version..."
$deployResult = Invoke-NativeCommand `
    -Name "Final Cloudflare Worker deployment" `
    -FilePath $npxPath `
    -Arguments @("wrangler", "deploy") `
    -Capture

$deployText = (@($deployResult.StdOut) + @($deployResult.StdErr)) -join "`n"
$workerUrl = [regex]::Match($deployText, "https://[^\s]+\.workers\.dev").Value.TrimEnd([char[]]"/.")

if (-not $workerUrl) {
    Write-Host ""
    Write-Host "The Worker deployed, but its workers.dev URL was not detected."
    Write-Host "Copy the URL printed by Wrangler and place it in Typely's root .env file as:"
    Write-Host "VITE_TYPELY_API_URL=https://your-worker.workers.dev"
    exit 0
}

$envPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\.env"))
Write-Utf8WithoutBom -Path $envPath -Text "VITE_TYPELY_API_URL=$workerUrl"

Write-Host ""
Write-Host "Typely API deployed successfully."
Write-Host "API URL: $workerUrl"
Write-Host "Environment file: $envPath"
Write-Host ""
Write-Host "Restart Typely so Vite reads the generated .env file."
