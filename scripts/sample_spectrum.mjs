import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const sampleIndices = [1, 10, 20, 35, 50, 65, 80, 95, 110, 130, 150, 175, 200, 225, 250, 275, 300, 315];

async function main() {
  for (const idx of sampleIndices) {
    const num = String(idx).padStart(3, "0");
    const file = `e(${num}).jpg`;
    const p = path.join("/tmp/thumbs", file);
    if (!fs.existsSync(p)) continue;
    const b64 = fs.readFileSync(p).toString("base64");
    try {
      const res = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: b64 } },
              { text: "این چه قطعه یا محصول صنعتی است؟ نام دقیق فارسی و انگلیسی، دسته‌بندی و زیردسته و کاربرد را به صورت JSON یک خطی بده: {\"name\":\"...\",\"nameEn\":\"...\",\"category\":\"...\",\"subcategory\":\"...\"}" }
            ]
          }
        ]
      });
      console.log(`e(${num}):`, res.text.trim());
    } catch (e) {
      console.log(`e(${num}) err:`, e.message);
    }
  }
}

main();
