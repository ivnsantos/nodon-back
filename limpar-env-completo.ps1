# Script PowerShell para remover .env COMPLETAMENTE do histórico do Git
# ⚠️ ATENÇÃO: Isso reescreve o histórico do Git em TODAS as branches!

Write-Host "🚨 ATENÇÃO: Este script vai remover .env de TODO o histórico do Git" -ForegroundColor Yellow
Write-Host "⚠️ Certifique-se de que rotacionou TODAS as chaves expostas!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Branches afetadas:" -ForegroundColor Cyan
git log --all --full-history --source --format="%h %d %s" -- .env | Select-Object -First 10
Write-Host ""
$confirm = Read-Host "Deseja continuar? (sim/nao)"

if ($confirm -ne "sim") {
    Write-Host "Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📋 Criando backup completo..." -ForegroundColor Cyan
$backupName = "backup-completo-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git branch $backupName

Write-Host ""
Write-Host "🗑️ Removendo .env de TODO o histórico (todas as branches)..." -ForegroundColor Cyan

# Remover .env de todas as branches usando filter-branch
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ .env removido do histórico!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🧹 Limpando referências antigas..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force .git/refs/original -ErrorAction SilentlyContinue
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    Write-Host ""
    Write-Host "🔍 Verificando se ainda há .env no histórico..." -ForegroundColor Cyan
    $checkAgain = git log --all --full-history --source -- .env
    if (-not $checkAgain) {
        Write-Host "✅ Confirmação: .env NÃO está mais no histórico!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📤 Próximos passos:" -ForegroundColor Yellow
        Write-Host "   1. Verificar o estado: git log --all --full-history --source -- .env" -ForegroundColor Gray
        Write-Host "   2. Fazer push forçado de TODAS as branches:" -ForegroundColor Gray
        Write-Host "      git push origin --force --all" -ForegroundColor Gray
        Write-Host "      git push origin --force --tags" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️ AVISO: Push forçado vai sobrescrever o histórico remoto!" -ForegroundColor Yellow
        Write-Host "   Certifique-se de que ninguém mais está trabalhando nessas branches." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ Ainda há referências ao .env:" -ForegroundColor Yellow
        Write-Host $checkAgain
        Write-Host ""
        Write-Host "💡 Considere usar git-filter-repo para uma limpeza mais completa:" -ForegroundColor Cyan
        Write-Host "   pip install git-filter-repo" -ForegroundColor Gray
        Write-Host "   git filter-repo --path .env --invert-paths --force" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Erro ao remover .env do histórico." -ForegroundColor Red
    Write-Host "💡 Tente usar git-filter-repo:" -ForegroundColor Cyan
    Write-Host "   pip install git-filter-repo" -ForegroundColor Gray
    Write-Host "   git filter-repo --path .env --invert-paths --force" -ForegroundColor Gray
}
