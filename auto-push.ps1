# Auto-commit and push changes to GitHub
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto: Update code at $timestamp"
git push origin main

Write-Host "✅ Changes pushed to GitHub! Vercel will auto-deploy..." -ForegroundColor Green
