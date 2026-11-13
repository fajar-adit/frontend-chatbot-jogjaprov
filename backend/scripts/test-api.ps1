# Run after the Go API starts. This script does not need to know or expose secrets.
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8090'

Write-Host '1) Checking API + Supabase connection...'
Invoke-RestMethod -Uri "$base/api/health" -Method Get | ConvertTo-Json -Depth 5

Write-Host "`n2) Sending a test question to Laras..."
$body = @{
  question = 'Apa persyaratan mengurus Kartu Keluarga di Bantul? Sertakan tautan layanan jika tersedia.'
} | ConvertTo-Json

Invoke-RestMethod -Uri "$base/api/chat" -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 10
