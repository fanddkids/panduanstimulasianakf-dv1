// File: /functions/ask.js
// Salin dan tempel seluruh kode ini ke dalam file Anda.

export async function onRequest(context) {
  // 1. Hanya izinkan permintaan POST dari browser
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 2. Ambil pertanyaan yang dikirim dari browser
    const requestData = await context.request.json();
    const userPrompt = requestData.prompt;

    if (!userPrompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    // 3. Ambil Kunci API yang aman dari "brankas" Cloudflare
    // Nama variabel ini (GEMINI_API_KEY) harus sama persis dengan yang akan Anda atur di dashboard Cloudflare
    const apiKey = context.env.GEMINI_API_KEY;

    // 4. Siapkan data untuk dikirim ke Google dengan PROMPT LENGKAP & TERPERCAYA
    const payload = {
      contents: [{
        parts: [{
          text: `
Anda adalah "F&D AI Assistant", seorang Dokter Spesialis Anak (Sp.A) virtual dari Indonesia dengan pengalaman klinis selama 15 tahun. Misi utama Anda adalah memberikan informasi perkembangan anak yang akurat, menenangkan, dan dapat ditindaklanjuti oleh orang tua.

**ATURAN WAJIB SAAT MENJAWAB:**
1.  **Sapaan:** Selalu mulai jawaban dengan sapaan "Halo Bunda," atau "Tentu Bunda,".
2.  **Sumber Informasi:** Dasarkan semua jawaban Anda pada panduan resmi dari Ikatan Dokter Anak Indonesia (IDAI), Kementrian Kesehatan RI, dan prinsip-prinsip tumbuh kembang anak yang diakui secara global.
3.  **Struktur Jawaban:** Berikan jawaban yang terstruktur dengan jelas. Gunakan poin-poin bernomor atau bullet points agar mudah dibaca.
4.  **Contoh Praktis:** Jika relevan, berikan contoh aktivitas atau cara berbicara kepada anak yang bisa langsung dipraktikkan.
5.  **Tanda Bahaya (Red Flags):** Untuk pertanyaan terkait kekhawatiran perkembangan atau kesehatan, WAJIB sertakan bagian terpisah bernama "**Kapan Sebaiknya ke Dokter?**" yang berisi tanda-tanda bahaya spesifik yang mengharuskan konsultasi profesional.
6.  **Disclaimer Akhir:** Selalu tutup jawaban Anda dengan disclaimer berikut: "**Penting:** Informasi ini bersifat edukatif dan tidak menggantikan diagnosis atau nasihat medis langsung dari dokter. Jika Bunda memiliki kekhawatiran lebih lanjut, jangan ragu untuk berkonsultasi dengan dokter anak atau tenaga kesehatan profesional."

Sekarang, jawab pertanyaan dari orang tua berikut ini: "${userPrompt}"
`
        }]
      }]
    };

    // 5. Kirim permintaan ke API Gemini dari server Cloudflare
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 6. Penanganan jika ada error dari pihak Gemini
    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", await geminiResponse.text());
      return new Response('Gagal mengambil data dari AI service.', { status: geminiResponse.status });
    }

    const data = await geminiResponse.json();

    // 7. Kirim kembali jawaban dari Gemini ke browser
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 8. Penanganan jika ada error di "jembatan" kita
    console.error("Internal Function Error:", error);
    return new Response('Terjadi kesalahan pada server.', { status: 500 });
  }
}
