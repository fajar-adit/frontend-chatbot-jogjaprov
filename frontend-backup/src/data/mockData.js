export const categories = [
  {
    id: 'kependudukan',
    title: 'Layanan Kependudukan',
    sub: 'KTP-el, KK, Akta & IKD Digital',
    iconName: 'ContactRound',
  },
  {
    id: 'pajak',
    title: 'Pajak & Samsat DIY',
    sub: 'Cek PKD & Jadwal Samsat Keliling',
    iconName: 'ReceiptText',
  },
  {
    id: 'perizinan',
    title: 'Perizinan & UMKM',
    sub: 'NIB OSS & Fasilitas SiBakul',
    iconName: 'Store',
  },
  {
    id: 'bansos',
    title: 'Bantuan Sosial',
    sub: 'Kartu Cerdas & Bantuan Warga',
    iconName: 'Heart',
  },
  {
    id: 'aspirasi',
    title: 'Aspirasi & Pengaduan',
    sub: 'Lapor Kerusakan & Layanan PPID',
    iconName: 'Megaphone',
  },
  {
    id: 'budaya',
    title: 'Budaya & Pariwisata',
    sub: 'Agenda Kraton, TBY & Malioboro',
    iconName: 'Landmark',
  },
];

export const quickQuestions = [
  'Syarat urus KTP',
  'Info bantuan sosial',
  'Agenda budaya hari ini',
  'Lapor kerusakan fasilitas',
  'Jadwal Samsat keliling',
  'Prosedur perizinan usaha',
];

export const cannedAnswers = {
  'Syarat urus KTP':
    'Untuk pengurusan KTP-el baru atau penggantian di DIY:\n1. Berusia minimal 17 tahun atau sudah menikah.\n2. Fotokopi Kartu Keluarga (KK) terbaru.\n3. Surat kehilangan dari Kepolisian (jika KTP hilang) atau fisik KTP lama (jika rusak/perubahan data).\n4. Anda juga dapat mengaktifkan Identitas Kependudukan Digital (IKD) melalui aplikasi IKD di Play Store/App Store dengan verifikasi ke Disdukcapil/Kemantren terdekat.',
  'Info bantuan sosial':
    'Program bantuan sosial Pemda DIY meliputi Kartu Cerdas DIY (KCD), Bantuan Pangan, PKH, serta Bantuan Iuran JKN. Untuk mengecek status penerima, Anda dapat mengunjungi portal resmi DTKS Kemensos atau menghubungi Dinas Sosial DIY melalui layanan Laras ini.',
  'Agenda budaya hari ini':
    'Agenda budaya unggulan hari ini di Yogyakarta:\n• Pertunjukan Gamelan & Tari di Bangsal Sri Manganti Kraton Jogja (10:00 - 12:00 WIB)\n• Pameran Seni Rupa di Taman Budaya Yogyakarta (TBY)\n• Atraksi Musik & Karawitan di Titik Nol Km & Pedestrian Malioboro.',
  'Lapor kerusakan fasilitas':
    'Untuk melaporkan kerusakan fasilitas umum di wilayah DIY (seperti jalan berlubang, lampu penerangan padam, halte bus, atau drainase), Anda dapat menyampaikan lokasi detail dan foto pendukung melalui menu Layanan Aspirasi & Pengaduan ini atau via portal LAPOR! DIY.',
  'Jadwal Samsat keliling':
    'Jadwal Samsat Keliling DIY beroperasi Senin s.d. Sabtu di titik strategis:\n• Samsat Keliling Kota: Alun-Alun Utara & Balai Kota Timoho (08.30 - 12.00 WIB)\n• Samsat Keliling Sleman: Lapangan Denggung & Monjali\n• Samsat Keliling Bantul: Pasar Seni Gabusan & Paseban\nSyarat: STNK asli, KTP pemilik asli sesuai STNK, dan bukti pembayaran PKB terakhir.',
  'Prosedur perizinan usaha':
    'Pengurusan perizinan berusaha dan UMKM di DIY:\n1. Pembuatan NIB (Nomor Induk Berusaha) melalui sistem OSS RBA (oss.go.id).\n2. Pendaftaran program SiBakul Jogja untuk pembinaan, sertifikasi halal gratis, dan pemasaran produk lokal melalui Dinas Koperasi & UKM DIY.',
};

export const weatherForecast = [
  { day: 'Kam', condition: 'rain', tempMax: '33°C', tempMin: '23°C', icon: '🌧️' },
  { day: 'Jum', condition: 'sunny', tempMax: '33°C', tempMin: '22°C', icon: '☀️' },
  { day: 'Sab', condition: 'sunny', tempMax: '34°C', tempMin: '22°C', icon: '☀️' },
  { day: 'Min', condition: 'cloudy-sun', tempMax: '32°C', tempMin: '24°C', icon: '🌤️' },
  { day: 'Sen', condition: 'cloudy-sun', tempMax: '32°C', tempMin: '23°C', icon: '🌤️' },
  { day: 'Sel', condition: 'cloudy-sun', tempMax: '30°C', tempMin: '24°C', icon: '🌤️' },
  { day: 'Rab', condition: 'cloudy-sun', tempMax: '31°C', tempMin: '23°C', icon: '🌤️' },
];

export const faqList = [
  {
    q: 'Apa itu Laras?',
    a: 'Laras (Layanan Digital Terpadu) adalah platform asisten virtual resmi Pemerintah Daerah D.I. Yogyakarta yang dirancang untuk mempermudah masyarakat mengakses informasi layanan publik, kependudukan, perizinan, bansos, dan agenda daerah secara cepat dan terpercaya.',
  },
  {
    q: 'Bagaimana cara menyampaikan pengaduan fasilitas umum?',
    a: 'Pilih kategori "Aspirasi & Pengaduan" di menu samping atau ketik langsung permasalahan fasilitas umum Anda lengkap dengan lokasi, kecamatan/kemantren, dan foto pendukung.',
  },
  {
    q: 'Apakah layanan konsultasi Laras berbayar?',
    a: 'Tidak. Seluruh layanan panduan dan informasi publik melalui Laras bebas biaya (gratis) untuk seluruh masyarakat.',
  },
  {
    q: 'Jam berapa layanan operasional chatbot Laras?',
    a: 'Chatbot asisten Laras beroperasi 24 jam setiap hari untuk memberikan jawaban otomatis berbasis basis data resmi Pemda DIY.',
  },
];
