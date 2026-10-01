import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeOne(num) {
  const file = `e(${num}).jpg`;
  const p = path.join("/tmp/thumbs", file);
  if (!fs.existsSync(p)) return null;
  const b64 = fs.readFileSync(p).toString("base64");
  
  const res = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: b64 } },
          { text: "این چه قطعه یا محصول صنعتی است؟ نام دقیق فارسی، نام انگلیسی، کد مدل یا شماره قطعه (اگر در عکس مشخص نیست یک کد مانند PRD-" + num + " بگذار)، برند، دسته بندی و زیردسته و مشخصات فنی را در قالب JSON بده: {\"file\":\"e(" + num + ").png\",\"code\":\"...\",\"name\":\"...\",\"nameEn\":\"...\",\"brand\":\"...\",\"categorySlug\":\"...\",\"categoryName\":\"...\",\"subcategory\":\"...\",\"description\":\"...\",\"technicalSpecs\":[{\"key\":\"...\",\"value\":\"...\"}]}" }
        ]
      }
    ],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(res.text);
}

async function run() {
  for (const n of ["001", "005", "013", "025", "050", "080", "120", "160", "200", "250", "300"]) {
    try {
      const t0 = Date.now();
      const data = await analyzeOne(n);
      console.log(`[${n}] ${data.name} | ${data.categoryName} (${Date.now() - t0}ms)`);
    } catch (e) {
      console.log(`[${n}] Error:`, e.message);
    }
  }
}

run();
