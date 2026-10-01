import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const testList = ["e(020).jpg", "e(050).jpg", "e(100).jpg"];

for (const f of testList) {
  const p = path.join("/tmp/thumbs", f);
  const base64 = fs.readFileSync(p).toString("base64");
  console.log(`Starting ${f}... (size: ${base64.length})`);
  const t0 = Date.now();
  try {
    const res = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64 } },
            { text: "این چه قطعه یا محصول صنعتی است؟ نام دقیق، کد یا مدل، برند، دسته‌بندی و کاربرد را به صورت JSON یک خطی بده: {\"name\": \"...\", \"code\": \"...\", \"category\": \"...\", \"subcategory\": \"...\"}" }
          ]
        }
      ]
    });
    console.log(`${f} done in ${Date.now() - t0}ms:`, res.text.trim());
  } catch (err) {
    console.log(`${f} error in ${Date.now() - t0}ms:`, err.message);
  }
}
