# Laras — Frontend React terintegrasi

Frontend ini menggunakan UI dari project React Laras yang terbaru dan mengirim pertanyaan ke service Golang terpisah melalui `POST /api/chat`. Jawaban dan tautan dari backend ditampilkan sebagai teks/link yang aman; API key RAGFlow tidak berada di frontend.

## Kebutuhan
- Node.js 18 atau lebih baru
- Backend chatbot Go berjalan di `http://localhost:8090`
- RAGFlow + Ollama aktif dan dikonfigurasi pada backend Go

## Menjalankan
```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Buka URL Vite yang ditampilkan, biasanya `http://localhost:5173`. File `.env.example` mengatur proxy Vite agar `/api/*` diteruskan ke `http://localhost:8090`. Jika backend berada di alamat/port lain, ubah `VITE_BACKEND_PROXY_TARGET` lalu mulai ulang Vite.

## Build produksi
```powershell
npm run build
```

## Catatan keamanan
Jangan menaruh API key RAGFlow, password Supabase, atau `DATABASE_URL` pada frontend. Semua kredensial tetap berada di service backend.
