# Laras Chatbot — Frontend React + Backend Golang terpisah

Paket ini menempatkan frontend dan backend chatbot sebagai dua folder/proses terpisah. Backend utama aplikasi kamu tidak perlu disentuh.

```text
laras-chatbot-standalone/
├── frontend/       # UI React Laras yang memanggil /api/chat
├── backend/        # API Go khusus chatbot, berjalan pada port 8090
└── README.md
```

## Urutan setup

1. Jalankan RAGFlow dan Ollama seperti yang sudah kamu siapkan.
2. Buat tabel Supabase dengan mengeksekusi `backend/migrations/001_init.sql` di Supabase SQL Editor.
3. Masuk ke folder `backend`, salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL`, `RAGFLOW_API_KEY`, serta `RAGFLOW_CHAT_ID`. Petunjuk rinci ada di `backend/README.md`.
4. Jalankan backend dari PowerShell:
   ```powershell
   cd backend
   Copy-Item .env.example .env
   notepad .env
   go mod tidy
   go run .
   ```
5. Di terminal kedua, jalankan frontend:
   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```
6. Buka alamat Vite yang ditampilkan, biasanya `http://localhost:5173`.

Frontend memakai proxy ke backend khusus chatbot di `http://localhost:8090`. Ini tidak menggantikan port atau route backend utama kamu. Jangan letakkan kunci RAGFlow atau connection string Supabase di frontend.

Untuk detail konfigurasi Supabase/RAGFlow, endpoint, dan troubleshooting, baca `backend/README.md` dan `frontend/README.md`.

## Catatan

- Semua data layanan yang sudah dimasukkan ke dataset RAGFlow tetap dikelola RAGFlow.
- Supabase hanya menyimpan sesi dan riwayat chat untuk service ini.
- Backend ini menggunakan API chat assistant RAGFlow `POST /api/v1/chat/completions` dan menyimpan `session_id` RAGFlow secara terpisah dari ID sesi lokal.
- Paket starter ini untuk pengembangan lokal. Sebelum dipasang ke internet, tambahkan autentikasi pengguna, pengikatan sesi ke pemilik, pembatasan request, dan HTTPS.
