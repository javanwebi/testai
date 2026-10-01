import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const files = ["e(014).png", "e(015).png", "e(016).png", "e(017).png", "e(018).png"];

const parts = [];
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const p = path.join("src", "assets", "imagesproducts", f);
  const base64 = fs.readFileSync(p).toString("base64");
  parts.push({ text: `=== تصویر شماره ${i + 1} (فایل: ${f}) ===` });
  parts.push({ inlineData: { mimeType: "image/png", data: base64 } });
}

parts.push({
  text: `شما مهندس ارشد و کارشناس قطعات صنعتی بازرگانی اطلس (نماینده انحصاری SWR و FORZA) هستید.
برای این ۵ تصویر صنعتی، نام دقیق قطعه بر اساس عکس، کد کاتالوگ یا کد پیش‌فرض استاندارد، برند (مثلا FORZA، SWR، اطلس، یا برند روی عکس)، دسته‌بندی، زیردسته، مشخصات فنی (جنس، کاربرد، مقاومت) و توضیحات کاربردی در کارخانجات را تحلیل کن.
پاسخ را فقط به صورت آرایه معتبر JSON زیر بازگردان:
[
  {
    "file": "e(014).png",
    "code": "کد قطعه یا کاتالوگ (مثلا AT-1014 یا کد روی محصول)",
    "name": "نام دقیق فارسی محصول طبق عکس",
    "nameEn": "English Name",
    "brand": "برند کالا",
    "categorySlug": "یک اسلاگ استاندارد انگلیسی متناسب",
    "categoryName": "نام دسته‌بندی اصلی",
    "subcategory": "زیردسته",
    "unit": "عدد/حلقه/شاخه/رول/ست",
    "basePrice": 450000,
    "stock": 40,
    "inquiryOnly": false,
    "technicalSpecs": [{"key": "مشخصه", "value": "مقدار"}],
    "description": "توضیح کاربرد قطعه در خط تولید"
  }
]`
});

try {
  const startTime = Date.now();
  console.log("Analyzing 5 images with gemini-flash-latest...");
  const res = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json" }
  });
  console.log("Completed in", (Date.now() - startTime), "ms");
  const data = JSON.parse(res.text);
  console.log("Parsed count:", data.length);
  data.forEach(d => console.log(d.file, ":", d.name, "(", d.categoryName, "/", d.subcategory, ")"));
} catch (e) {
  console.error("Error:", e.message);
}
