$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'File .env dibuat dari .env.example.' -ForegroundColor Yellow
  Write-Host 'Isi DATABASE_URL, RAGFLOW_API_KEY, dan RAGFLOW_CHAT_ID pada .env, lalu jalankan .\start.ps1 lagi.' -ForegroundColor Yellow
  exit 1
}

Write-Host 'Memastikan dependency Go tersedia...' -ForegroundColor Cyan
go mod tidy
if ($LASTEXITCODE -ne 0) { throw 'go mod tidy gagal. Periksa koneksi internet dan pesan error di atas.' }

Write-Host 'Menjalankan Laras Chatbot API pada port 8090...' -ForegroundColor Green
go run .
