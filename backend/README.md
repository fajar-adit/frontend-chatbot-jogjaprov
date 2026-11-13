# Laras Chatbot API (service terpisah)

Backend Golang khusus chatbot Laras. Service ini berdiri sendiri dan **tidak perlu digabung ke backend utama kamu**. Frontend React mengirim request ke service ini, service meneruskan pertanyaan ke RAGFlow lokal, lalu menyimpan riwayat ke Supabase PostgreSQL.

## Arsitektur

```text
Frontend React (Vite :5173)
        | POST /api/chat (proxy)
        v
Laras Chatbot API - Go (:8090)  <-- service terpisah dari backend utama
        |                         \
        | RAGFlow API              \ PostgreSQL TLS
        v                           v
RAGFlow lokal (:80)             Supabase PostgreSQL
        |
        +-- Chat assistant + dataset layanan DIY + Ollama
```

API Go dijalankan langsung di Windows untuk memudahkan akses ke `http://localhost` RAGFlow yang sudah ada di Docker Desktop. Data dokumen/embedding tetap dikelola RAGFlow; Supabase hanya menyimpan sesi dan riwayat chat.

## Struktur folder

```text
laras-chatbot-api/
├── main.go
├── go.mod
├── .env.example
├── .gitignore
├── internal/
│   ├── config/config.go
│   ├── httpapi/server.go
│   ├── ragflow/client.go
│   └── store/store.go
├── migrations/001_init.sql
└── scripts/test-api.ps1
```

## 1. Prasyarat

- Go 1.23 atau lebih baru.
- RAGFlow lokal sudah berjalan di Docker Desktop dan bisa dibuka melalui `http://localhost`.
- Chat assistant Laras sudah dibuat di RAGFlow, dataset-nya telah dipilih, dan model chat siap digunakan.
- API key RAGFlow.
- Project Supabase PostgreSQL.
- Node.js jika ingin menjalankan frontend React.

## 2. Siapkan tabel Supabase

1. Buka Supabase Dashboard → SQL Editor.
2. Buka `migrations/001_init.sql` di editor teks.
3. Salin dan jalankan SQL tersebut.
4. Tabel yang dibuat khusus untuk service ini adalah `laras_chatbot_sessions` dan `laras_chatbot_messages`; tabel backend utama tidak disentuh.

Gunakan connection string PostgreSQL dari Supabase Dashboard → Project Settings → Database. Connection string untuk mode direct atau pooler dapat berbeda bergantung jaringan. Pastikan SSL digunakan. Jika password memiliki karakter khusus, URL-encode password terlebih dahulu.

## 3. Konfigurasi API

Di PowerShell, masuk ke folder hasil ekstraksi ZIP ini, kemudian jalankan:

```powershell
Copy-Item .env.example .env
notepad .env
```

Isi variabel berikut:

```env
PORT=8090
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
RAGFLOW_BASE_URL=http://localhost
RAGFLOW_API_KEY=API_KEY_DARI_RAGFLOW
RAGFLOW_CHAT_ID=CHAT_ID_CHATBOT_LARAS
RAGFLOW_TIMEOUT_SECONDS=180
```

Cara mendapatkan `RAGFLOW_API_KEY`: buka pengaturan API key di RAGFlow lokal dan buat/ambil key. Cara mendapatkan `RAGFLOW_CHAT_ID`: buka Chat Laras; ID biasanya terlihat pada URL atau pengaturan chatbot. Jangan menggunakan ID dataset sebagai `RAGFLOW_CHAT_ID`—yang dibutuhkan adalah ID **chat assistant**.

Jangan kirim `.env` ke Git atau frontend. `RAGFLOW_API_KEY` dan `DATABASE_URL` adalah rahasia backend.

## 4. Jalankan service di Windows

Buka PowerShell di folder `laras-chatbot-api` dan jalankan:

```powershell
go mod tidy
go run .
```

Service berjalan di `http://localhost:8090`. Terminal tetap harus hidup selama API digunakan. Untuk menghentikan API, tekan `Ctrl+C`.

Tes health check di terminal lain:

```powershell
Invoke-RestMethod http://localhost:8090/api/health
```

Hasil sukses serupa dengan:

```json
{
  "status": "ok",
  "service": "laras-chatbot-api",
  "database": "connected"
}
```

## 5. Hubungkan frontend React yang sudah disiapkan

Frontend tidak perlu digabung dengan backend utama. Di folder project frontend Laras, buat atau edit file `.env` (folder yang berisi `package.json` dan `vite.config.js`) dengan isi:

```env
VITE_API_BASE_URL=
VITE_BACKEND_PROXY_TARGET=http://localhost:8090
```

`VITE_API_BASE_URL` sengaja kosong supaya request `/api/chat` memakai proxy Vite. Simpan lalu restart Vite (`Ctrl+C`, kemudian `npm run dev`). Jangan menaruh API key RAGFlow maupun `DATABASE_URL` di frontend.

Jika Vite sudah berjalan dan `.env` diubah, harus restart Vite agar konfigurasi proxy dibaca ulang.

## 6. Endpoint

### `GET /api/health`
Memeriksa API dan koneksi database.

### `POST /api/chat`
Request:

```json
{
  "question": "Bagaimana persyaratan layanan X?",
  "session_id": "opsional-uuid-dari-respons-sebelumnya",
  "category": "opsional"
}
```

Respons:

```json
{
  "session_id": "uuid-sesi-lokal",
  "answer": "Jawaban dari RAGFlow...",
  "sources": {
    "chunks": []
  }
}
```

`session_id` dari API ini adalah ID sesi lokal untuk frontend. ID sesi RAGFlow disimpan terpisah di database. Dengan begitu kontrak frontend tetap stabil dan sesi native RAGFlow dapat dilanjutkan.

### `GET /api/sessions/{session_id}/messages`
Mengembalikan sampai 200 pesan dari riwayat sesi.

## 7. Link sumber layanan

Endpoint API mengembalikan jawaban dan metadata reference dari RAGFlow. Frontend Laras yang disertakan dalam paket terdahulu merender URL HTTP/HTTPS dan tautan Markdown sebagai link yang dapat diklik. Ketepatan link tetap bergantung pada URL yang tersedia pada rekod dan hasil retrieval. System prompt di RAGFlow sebaiknya menginstruksikan model untuk hanya memakai URL dari rekod yang relevan serta menandai status belum terverifikasi.

## 8. Troubleshooting

- **`DATABASE_URL` gagal:** cek connection string Supabase, SSL (`sslmode=require`), dan URL-encode karakter khusus password.
- **RAGFlow HTTP 401/403:** cek `RAGFLOW_API_KEY`.
- **Chat tidak ditemukan:** pastikan `RAGFLOW_CHAT_ID` adalah ID chat assistant dan dataset sudah terhubung ke chat itu.
- **RAGFlow tidak bisa dihubungi:** pastikan Docker Desktop/engine berjalan dan `http://localhost` membuka RAGFlow.
- **Timeout:** lihat log RAGFlow dan Ollama, kurangi Top N pada chat RAGFlow, dan pastikan model embedding merespons.
- **Tidak ada sumber:** cek hasil Retrieval Testing dan apakah referensi aktif dikembalikan oleh RAGFlow.
- **Port 8090 terpakai:** ubah `PORT` menjadi misalnya `8091` dan sesuaikan `VITE_BACKEND_PROXY_TARGET`.

## Catatan keamanan

Ini adalah starter untuk pengembangan lokal. Karena belum ada autentikasi pengguna, jangan mengekspos service API ke internet atau jaringan publik. Untuk produksi, tambahkan autentikasi (misalnya Supabase Auth/JWT), pengikatan sesi ke pengguna, rate limiting, HTTPS/reverse proxy, serta kebijakan retensi data. API memakai koneksi PostgreSQL dari backend Go dan tidak memerlukan akses Supabase langsung dari frontend.
