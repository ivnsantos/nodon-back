# Script para criar arquivo .env
$envContent = @"
DB_SSL=false
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_NAME=nodondb
WALLETID_ASAAS=f8b6dd74-3874-4374-9b73-a6ea9528675f
ASAAS_API_KEY=sua_chave_api_asaas_aqui
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
JWT_SECRET=NodonDentista@8898GOLdoPalmeiras
PORT=5000
"@

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️ Arquivo .env já existe em: $envPath" -ForegroundColor Yellow
    Write-Host "Por favor, edite o arquivo manualmente e adicione sua ASAAS_API_KEY" -ForegroundColor Yellow
} else {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ Arquivo .env criado em: $envPath" -ForegroundColor Green
    Write-Host "⚠️ IMPORTANTE: Edite o arquivo .env e substitua 'sua_chave_api_asaas_aqui' pela sua chave real da Asaas!" -ForegroundColor Yellow
}

