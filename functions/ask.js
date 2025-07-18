// File: /functions/ask.js (Versi Baru dengan Logging Error yang Lebih Baik)

export async function onRequest(context) {
  // 1. Hanya izinkan permintaan POST
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const requestData = await context.request.json();
    const userPrompt = requestData.prompt;

    if (!userPrompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const apiKey = context.env.GEMINI_API_KEY;

    // Jika tidak ada API Key, kirim error yang jelas
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in environment variables.");
        return new Response(JSON.stringify({ error: "Server configuration error: API key is missing." }), { status: 500 });
    }

    const payload = {
      contents: [{
        parts: [{
          text: `Anda adalah seorang ahli perkembangan anak dari Indonesia yang ramah dan membantu bernama "F&D AI Assistant". Berikan jawaban yang jelas, terstruktur, dan mudah dipahami oleh orang tua. Selalu gunakan sapaan "Bunda" atau "Ayah". Berikan disclaimer bahwa informasi ini adalah panduan umum dan tidak menggantikan konsultasi medis profesional. Jawab pertanyaan berikut dalam Bahasa Indonesia: "${userPrompt}"`
        }]
      }]
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Jika respons dari Google tidak "Ok", kita catat dan kirim errornya
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error Response:", errorText); // Ini akan muncul di Log Cloudflare
      return new Response(JSON.stringify({ error: `Google API Error: ${errorText}` }), { status: geminiResponse.status });
    }

    const data = await geminiResponse.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Catch Block Error:", error); // Menangkap error lain
    return new Response(JSON.stringify({ error: `Internal function error: ${error.message}` }), { status: 500 });
  }
}