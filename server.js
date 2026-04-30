const express = require('express');
const axios = require('axios');
const PptxGenJS = require('pptxgenjs');
const path = require('path');

const app = express();
app.use(express.json());

const GROQ_API_KEY = "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";

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.post('/api/generate', async (req, res) => {
    const { topic } = req.body;

    try {
        const aiResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Sen profesyonel bir sunum tasarımcısısın. Kullanıcının verdiği konuyu şu kriterlere göre hazırla:
                    - Hedef kitle: Genel izleyici ve profesyoneller.
                    - Amaç: Hem bilgilendirme hem etkileyici bir sunum.
                    - Yapı: İlk slayt çarpıcı bir giriş (istatistik/soru), orta slaytlar adım adım anlatım, bir slaytta gerçek hayat örneği, son slayt güçlü özet ve CTA.
                    - Her slayt için: Başlık, net maddeler, konuşmacı notu (notes) ve görsel önerisi (img_keyword).
                    - Yanıtı SADECE JSON ver: {"title": "..", "subtitle": "..", "design": {"colors": "..", "fonts": ".."}, "slides": [{"h": "..", "b": [".."], "notes": "..", "img": ".."}]}`
                },
                { role: "user", content: `Konu: ${topic}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const data = JSON.parse(aiResponse.data.choices[0].message.content);

        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_WIDE';

        // Kapak Slaytı
        let slide0 = pptx.addSlide();
        slide0.background = { color: '0F172A' };
        slide0.addText(data.title, { x: 1, y: 2.5, w: '80%', fontSize: 44, bold: true, color: 'F59E0B', align: 'center' });
        slide0.addText(data.subtitle || "Stratejik Analiz", { x: 1, y: 4, w: '80%', fontSize: 20, color: 'FFFFFF', align: 'center' });
        slide0.addNotes(`Tasarım Önerisi: ${data.design.colors}, Font: ${data.design.fonts}`);

        // İçerik Slaytları
        data.slides.forEach((s, idx) => {
            let slide = pptx.addSlide();
            
            // Başlık
            slide.addText(s.h, { x: 0.5, y: 0.4, w: '90%', fontSize: 28, bold: true, color: 'F59E0B' });
            
            // Maddeler
            let bullets = s.b.map(item => ({ text: item, options: { bullet: true, color: '333333', fontSize: 18 } }));
            slide.addText(bullets, { x: 0.5, y: 1.5, w: '60%', h: 4 });

            // Görsel Placeholder (Unsplash)
            slide.addImage({ 
                path: `https://source.unsplash.com/800x600/?${s.img || 'business'}`, 
                x: 7.2, y: 1, w: 5.5, h: 5 
            });

            // Konuşmacı Notları (PowerPoint'in altındaki notlar kısmına eklenir)
            slide.addNotes(s.notes);
        });

        const b64 = await pptx.write('base64');
        res.json({ buffer: b64, fileName: `Duhan_Elite_${Date.now()}.pptx` });

    } catch (error) {
        res.status(500).json({ error: "Hata" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Duhan AI Aktif.'));
module.exports = app;
