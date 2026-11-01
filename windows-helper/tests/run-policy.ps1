# DuoDesk GPL-3.0. Compiles and runs only the pure policy test, never the input helper.
$ErrorActionPreference = 'Stop'
$testRoot = $PSScriptRoot
$nativeRoot = Split-Path $testRoot -Parent
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$output = Join-Path $testRoot 'bin'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$testExe = Join-Path $output 'EdgePolicyTests.exe'
& $compiler /nologo /target:exe /r:System.Drawing.dll "/out:$testExe" (Join-Path $nativeRoot 'src\EdgePolicy.cs') (Join-Path $testRoot 'EdgePolicyTests.cs')
if ($LASTEXITCODE -ne 0) { throw 'Native policy test compilation failed' }
& $testExe
if ($LASTEXITCODE -ne 0) { throw 'Native policy tests failed' }
