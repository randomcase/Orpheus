param(
    [ValidateSet("build", "test", "report", "serve", "validate")]
    [string]$Task = "test"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $env:JAVA_HOME -and (Test-Path "C:\Program Files\Java\jdk-21.0.11")) {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.11"
}

switch ($Task) {
    "validate" {
        Push-Location (Join-Path $Root "go-engine")
        try {
            go run ./cmd/orpheus-engine --mode=validate --data-dir=../data
        } finally {
            Pop-Location
        }
    }
    "build" {
        New-Item -ItemType Directory -Force -Path (Join-Path $Root "bin") | Out-Null
        Push-Location (Join-Path $Root "go-engine")
        try {
            go build -o (Join-Path $Root "bin\orpheus-engine.exe") ./cmd/orpheus-engine
        } finally {
            Pop-Location
        }
        Push-Location (Join-Path $Root "springboot-app")
        try {
            & .\gradlew.bat bootJar --no-daemon
        } finally {
            Pop-Location
        }
    }
    "test" {
        Push-Location (Join-Path $Root "go-engine")
        try {
            go test -v "-coverprofile=coverage.out" ./...
            go test "-bench=." -benchmem ./internal/translit
        } finally {
            Pop-Location
        }
        Push-Location (Join-Path $Root "springboot-app")
        try {
            & .\gradlew.bat test jacocoTestReport --no-daemon
        } finally {
            Pop-Location
        }
        Push-Location $Root
        try {
            python scripts/build_portal_and_report.py
        } finally {
            Pop-Location
        }
    }
    "report" {
        Push-Location $Root
        try {
            python scripts/build_portal_and_report.py
        } finally {
            Pop-Location
        }
    }
    "serve" {
        & $PSCommandPath -Task build
        $goProc = Start-Process -FilePath (Join-Path $Root "bin\orpheus-engine.exe") `
            -ArgumentList "--mode=serve", "--port=8091", ("--data-dir=" + (Join-Path $Root "data")) `
            -PassThru
        Write-Host "Started Go Engine (PID $($goProc.Id)) on http://127.0.0.1:8091"
        Push-Location (Join-Path $Root "springboot-app")
        try {
            & .\gradlew.bat bootRun --no-daemon
        } finally {
            Pop-Location
            if ($goProc -and -not $goProc.HasExited) {
                Stop-Process -Id $goProc.Id -Force
            }
        }
    }
}
