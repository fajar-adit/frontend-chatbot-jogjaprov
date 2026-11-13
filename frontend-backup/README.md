# Laras — Frontend React terhubung ke API chatbot

Frontend ini mempertahankan UI portal dan chatbot Laras, tetapi mengganti jawaban simulasi (`cannedAnswers`) dengan panggilan ke backend Golang.

## Apa yang sudah diintegrasikan

- Pertanyaan dikirim ke `POST /api/chat` melalui `src/services/chatApi.js`.
- Mengirim `question`, `session_id` (jika ada), dan kategori hanya jika pengguna memilih kategori secara eksplisit.
- Menampilkan jawaban dari backend, referensi sumber, serta penanda sumber yang belum terverifikasi jika metadata tersedia.
- URL dalam jawaban, termasuk Markdown `[Buka layanan](https://...)`, ditampilkan sebagai tautan yang dapat diklik.
- API key RAGFlow dan kredensial Supabase tidak disimpan pada frontend.
- Dev server Vite mem-proxy `/api/*` ke backend Go khusus chatbot pada `http://localhost:8090` secara default.

## Menjalankan frontend

Prasyarat: Node.js 18+ dan backend Golang aktif.

PowerShell:

```powershell
cd D:\lokasi\laras-react-frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

File `.env.example` berisi:

```env
VITE_API_BASE_URL=
VITE_BACKEND_PROXY_TARGET=http://localhost:8090
```

Biasanya `VITE_API_BASE_URL` dibiarkan kosong untuk development lokal. Jika backend berjalan di alamat berbeda, ubah `VITE_BACKEND_PROXY_TARGET`. Pada paket ini, backend chatbot berdiri sendiri di port `8090`, terpisah dari backend utama. Setelah mengubah `.env`, restart Vite.

## Kontrak API yang dibutuhkan frontend

Request:

```json
{
  "question": "Bagaimana persyaratan layanan X?",
  "session_id": "opsional-uuid",
  "category": "opsional; hanya jika kategori dipilih pengguna"
}
```

Respons sukses yang diharapkan:

```json
{
  "session_id": "uuid-sesi",
  "answer": "Jawaban berdasarkan dokumen. Tautan: [Buka layanan](https://contoh.go.id/layanan)",
  "sources": {
    "chunks": [
      {
        "content": "Cuplikan dokumen sumber...",
        "doc_name": "data_sleman.md",
        "metadata": {
          "Layanan": "Nama layanan",
          "Link": "https://contoh.go.id/layanan",
          "Audit Status": "NEED_REVIEW"
        }
      }
    ]
  }
}
```

Nama field pada `sources` dapat berbeda antarkonfigurasi RAGFlow. `chatApi.js` menormalkan beberapa bentuk umum seperti `chunks`, `references`, `sources`, dan `doc_aggs`. Pastikan backend Go mengembalikan `answer`, `session_id`, dan `sources`/`reference`.

## Penting: backend masih dibutuhkan

Frontend tidak memanggil RAGFlow langsung agar API key tidak terlihat di browser. Backend Go harus menyediakan `POST /api/chat` dan meneruskan pertanyaan ke chatbot RAGFlow lokal, lalu mengembalikan jawaban beserta referensi.

Untuk konfigurasi RAGFlow lokal, URL base umumnya `http://localhost` dari host tempat Go berjalan; gunakan `chat_id` dan API key RAGFlow di environment backend, bukan di frontend. Jika backend Golang belum aktif, frontend akan menampilkan pesan koneksi.

## Tautan layanan

Frontend membuat tautan dari URL HTTP/HTTPS yang dikembalikan dalam jawaban atau metadata referensi. Namun, ketepatan tautan tetap bergantung pada data RAGFlow dan logika backend. Pastikan sumber cocok dengan nama layanan dan wilayah; jangan menganggap rekod `NEED_REVIEW`, `PARTIAL`, `BELUM TERVERIFIKASI`, atau `OUT_OF_SCOPE` sebagai informasi terkonfirmasi.
