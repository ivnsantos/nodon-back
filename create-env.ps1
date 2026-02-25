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

# Cloudflare R2 (para upload de imagens)
R2_ACCOUNT_ID=016184c3fec4e160e9b38a985a7fc4db
R2_ACCESS_KEY_ID=0cc461c690364ea512d5151cb4e41f38
R2_SECRET_ACCESS_KEY=5c456726242aee7b5ae71cf547e048ce89c6111ce636f6303df083876011cd6b
R2_BUCKET_NAME=hml
R2_PUBLIC_DOMAIN=https://pub-f6373861b23346918a681332b65f9a68.r2.dev
R2_BUCKET_NAME_DOC_CLIENTS=doc_clients
R2_PUBLIC_DOMAIN_DOC_CLIENTS=https://pub-f6373861b23346918a681332b65f9a68.r2.dev
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

