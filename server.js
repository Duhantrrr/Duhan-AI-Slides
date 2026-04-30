const express = require('express');
const axios = require('axios');
const PptxGenJS = require('pptxgenjs');
const path = require('path');

const app = express();
app.use(express.json());

// API Anahtarını buraya gömdük (Dışarıdan kimse göremez)
const GROQ_API_KEY = "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";

// Ana sayfayı göster
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunum oluşturma endpointi
app.post('/api/generate', async (req, res) => {
    const { topic } = req.body;

    try {
        // 1. Groq AI ile İçerik Üretimi
        const aiResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "user",
                content: `'${topic}' hakkında 10 slaytlık profesyonel sunum içeriği hazırla. Yanıtı SADECE JSON formatında ver: {"title": "Başlık", "slides": [{"h": "Slayt Başlığı", "d": ["Madde 1", "Madde 2"]}]}`
            }],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const data = JSON.parse(aiResponse.data.choices[0].message.content);

        // 2. PPTX Dosyasını İnşa Et
        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_WIDE';

        // Kapak
        let slide0 = pptx.addSlide();
        slide0.background = { color: '0F172A' };
        slide0.addText(data.title, { x: 1, y: 3, w: '80%', fontSize: 44, bold: true, color: 'F59E0B', align: 'center' });

        // İçerik Slaytları
        data.slides.forEach(s => {
            let slide = pptx.addSlide();
            slide.addText(s.h, { x: 0.5, y: 0.4, w: '90%', fontSize: 28, bold: true, color: 'F59E0B' });
            let bullets = s.d.map(item => ({ text: item, options: { bullet: true, color: '333333', fontSize: 18 } }));
            slide.addText(bullets, { x: 0.5, y: 1.5, w: '90%', h: 5 });
        });

        // Dosyayı Base64 olarak geri gönder
        const b64 = await pptx.write('base64');
        res.json({ buffer: b64, fileName: `Duhan_AI_${Date.now()}.pptx` });

    } catch (error) {
        res.status(500).json({ error: "Hata" });
    }
});

// Vercel için port ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Duhan AI Aktif.'));

module.exports = app; // Vercel için gerekli
