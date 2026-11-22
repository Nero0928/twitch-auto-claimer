# Build a store zip of the extension only.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\package.ps1
# Output: dist\twitch-auto-claimer-<version>.zip
# The zip root is the extension (manifest.json at the top). Docs, scripts,
# store-assets, and git metadata are left out. Entry names use forward slashes.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 -Path $manifestPath | ConvertFrom-Json
$version = [string]$manifest.version
if ([string]::IsNullOrWhiteSpace($version)) {
  throw "manifest.json has no version"
}

$files = New-Object System.Collections.Generic.List[object]

function Add-RelFile([string]$fullPath) {
  $rel = $fullPath.Substring($root.Length).TrimStart([char[]]@('\', '/'))
  $rel = $rel -replace '\\', '/'
  $script:files.Add([pscustomobject]@{ Full = $fullPath; Name = $rel })
}

Add-RelFile $manifestPath

Get-ChildItem -Path $root -File | Where-Object {
  $_.Extension -eq ".js" -or $_.Extension -eq ".html"
} | ForEach-Object { Add-RelFile $_.FullName }

function Add-Tree([string]$dirName) {
  $abs = Join-Path $root $dirName
  Get-ChildItem -Path $abs -Recurse -File | ForEach-Object { Add-RelFile $_.FullName }
}

Add-Tree "_locales"
Add-Tree "icons"

$forbidden = "(\.md$)|(^\.git(/|$))|(^scripts/)|(^store-assets/)|(^dist/)"
foreach ($file in $files) {
  if ($file.Name -match $forbidden -or $file.Name.Contains("..")) {
    throw "Refusing to pack $($file.Name)"
  }
}

$required = @(
  "manifest.json",
  "background.js",
  "content.js",
  "popup.js",
  "settings.js",
  "popup.html",
  "settings.html",
  "_locales/en/messages.json",
  "_locales/zh_TW/messages.json",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png"
)
$names = @{}
foreach ($file in $files) { $names[$file.Name] = $true }
foreach ($name in $required) {
  if (-not $names.ContainsKey($name)) { throw "Missing $name" }
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$outDir = Join-Path $root "dist"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outPath = Join-Path $outDir "twitch-auto-claimer-$version.zip"
if (Test-Path $outPath) { Remove-Item -Force $outPath }

$stream = [System.IO.File]::Open($outPath, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($file in ($files | Sort-Object Name)) {
    $entry = $archive.CreateEntry($file.Name, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    try {
      $bytes = [System.IO.File]::ReadAllBytes($file.Full)
      $entryStream.Write($bytes, 0, $bytes.Length)
    } finally {
      $entryStream.Dispose()
    }
  }
} finally {
  $archive.Dispose()
  $stream.Dispose()
}

Write-Output $outPath
foreach ($file in ($files | Sort-Object Name)) {
  Write-Output ("  " + $file.Name)
}
