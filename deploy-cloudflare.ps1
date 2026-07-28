$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicDirectory = Join-Path $root '.cloudflare-package\public'

Push-Location $root
try {
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "L'installation des dépendances a échoué." }

  & npm.cmd run build:feeds
  if ($LASTEXITCODE -ne 0) { throw "La préparation du registre des sources a échoué." }

  & npx.cmd wrangler d1 migrations apply riskveille-db --remote
  if ($LASTEXITCODE -ne 0) { throw "La mise à jour de la base Cloudflare a échoué." }
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Path $publicDirectory -Force | Out-Null

$publicFiles = @(
  'index.html',
  'README.md',
  'SOURCES.md'
)

foreach ($file in $publicFiles) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination $publicDirectory -Force
}

$publicAssets = Join-Path $publicDirectory 'assets'
if (Test-Path -LiteralPath $publicAssets) {
  Remove-Item -LiteralPath $publicAssets -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $root 'assets') -Destination $publicAssets -Recurse -Force

& npx.cmd wrangler deploy --config (Join-Path $root 'wrangler.jsonc')
if ($LASTEXITCODE -ne 0) {
  throw "Le déploiement Cloudflare a échoué avec le code $LASTEXITCODE."
}

& npx.cmd wrangler pages deploy $publicDirectory --project-name riskveillecrf --branch main --commit-dirty=true
if ($LASTEXITCODE -ne 0) {
  throw "Le déploiement de l'interface riskveillecrf.pages.dev a échoué avec le code $LASTEXITCODE."
}
