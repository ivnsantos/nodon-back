# Script PowerShell para remover .env do histórico do Git
# ⚠️ ATENÇÃO: Isso reescreve o histórico do Git!

Write-Host "🚨 ATENÇÃO: Este script vai remover .env do histórico do Git" -ForegroundColor Yellow
Write-Host "⚠️ Certifique-se de que rotacionou a chave da API da OpenAI exposta!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Deseja continuar? (sim/nao)"

if ($confirm -ne "sim") {
    Write-Host "Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📋 Criando backup da branch atual..." -ForegroundColor Cyan
git branch backup-feature-chat-$(Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host ""
Write-Host "🔍 Verificando se .env está no histórico..." -ForegroundColor Cyan
$envInHistory = git log --all --full-history --source -- .env
if ($envInHistory) {
    Write-Host "⚠️ .env encontrado no histórico!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🗑️ Removendo .env do histórico..." -ForegroundColor Cyan
    
    # Remover .env do histórico usando filter-branch
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- feature/chat
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ .env removido do histórico!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔍 Verificando novamente..." -ForegroundColor Cyan
        $checkAgain = git log --all --full-history --source -- .env
        if (-not $checkAgain) {
            Write-Host "✅ Confirmação: .env não está mais no histórico!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📤 Próximo passo: fazer push forçado" -ForegroundColor Yellow
            Write-Host "   git push origin feature/chat --force" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️ Ainda há referências ao .env. Verifique manualmente." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Erro ao remover .env do histórico." -ForegroundColor Red
    }
} else {
    Write-Host "✅ .env não encontrado no histórico (ou já foi removido)" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 Dica: Se o problema persistir, considere usar git-filter-repo:" -ForegroundColor Cyan
Write-Host "   pip install git-filter-repo" -ForegroundColor Gray
Write-Host "   git filter-repo --path .env --invert-paths --force" -ForegroundColor Gray
