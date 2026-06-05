import dotenv from 'dotenv';
dotenv.config();

// ── API kalitlari ─────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = 'gemini-1.5-flash'; // Bepul, tez, vision qo'llab-quvvatlaydi

// ─────────────────────────────────────────────────────────────────────────────
// Mahalliy toifalash (fallback)
// ─────────────────────────────────────────────────────────────────────────────
export function autoCategorize(merchant) {
  const m = merchant.toLowerCase();
  if (m.includes('korzinka') || m.includes('makro') || m.includes('carrefour') || m.includes('arzon') || m.includes('havas') || m.includes('supermarket') || m.includes('oziq')) {
    return '🛒 Oziq-ovqat';
  }
  if (m.includes('bolt') || m.includes('yandex') || m.includes('didox') || m.includes('metro') || m.includes('taxi') || m.includes('taksi') || m.includes('avto')) {
    return '🚗 Transport';
  }
  if (m.includes('burger') || m.includes('pizza') || m.includes('cafe') || m.includes('kafe') || m.includes('evos') || m.includes('kfc') || m.includes('feedup') || m.includes('osh') || m.includes('lavash') || m.includes('restoran')) {
    return '🍕 Restoran';
  }
  if (m.includes('apteka') || m.includes('shifo') || m.includes('dorixona') || m.includes('med') || m.includes('klinika') || m.includes('dent')) {
    return "💊 Sog'liq";
  }
  if (m.includes('texnomart') || m.includes('mediapark') || m.includes('ishonch') || m.includes('credit') || m.includes('elmakon') || m.includes('mebel') || m.includes('telefon')) {
    return '🏠 Maishiy';
  }
  if (m.includes('gaz') || m.includes('suv') || m.includes('elektr') || m.includes('svet') || m.includes('kommunal') || m.includes('payme') || m.includes('click')) {
    return '💡 Kommunal';
  }
  return '🎯 Boshqa';
}

// ─────────────────────────────────────────────────────────────────────────────
// Regex orqali tezkor SMS tahlili (fallback — API bo'lmasa)
// ─────────────────────────────────────────────────────────────────────────────
export function parseSMSWithRegex(smsText) {
  const uzcardRegex  = /Uzcard\.\s+Savdo:\s+(.+?)\s+([\d\s,]+)\s*UZS\.\s+Qoldiq:\s*([\d\s,]+)\s*UZS/i;
  const humoRegex    = /HUMO\.\s+To'lov:\s+(.+?)\s+([\d\s,]+)\s*UZS\.\s+Balans:\s*([\d\s,]+)\s*UZS/i;
  const kapitalRegex = /([\d\s,]+)\s*UZS\s+(.+?)\s+uchun\s+to'landi/i;

  let merchant = '', amount = 0;

  let match = smsText.match(uzcardRegex);
  if (match) {
    merchant = match[1].trim();
    amount = parseFloat(match[2].replace(/\s|,/g, ''));
  } else {
    match = smsText.match(humoRegex);
    if (match) {
      merchant = match[1].trim();
      amount = parseFloat(match[2].replace(/\s|,/g, ''));
    } else {
      match = smsText.match(kapitalRegex);
      if (match) {
        amount = parseFloat(match[1].replace(/\s|,/g, ''));
        merchant = match[2].trim();
      }
    }
  }

  if (amount > 0 && merchant) {
    return { amount, merchant, category: autoCategorize(merchant), currency: 'UZS' };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API helper — JSON javob qaytaradi
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini(parts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 256,
      temperature: 0.1,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API xatolik: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // JSON ni tozalash (ba'zida ```json ... ``` bilan kelishi mumkin)
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS matnini Gemini orqali tahlil qilish
// ─────────────────────────────────────────────────────────────────────────────
export async function parseSMSWithAI(smsText) {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API Key topilmadi. Regex tahlilidan foydalanilmoqda...');
    return parseSMSWithRegex(smsText);
  }

  try {
    const prompt = `You are a financial assistant for Uzbekistan.
Parse this bank SMS or expense note and return ONLY JSON, no explanation:
{"amount": number, "merchant": string, "category": string, "currency": "UZS"}

Category must be exactly one of: "🛒 Oziq-ovqat", "🚗 Transport", "🍕 Restoran", "💊 Sog'liq", "🏠 Maishiy", "💡 Kommunal", "🎯 Boshqa"

SMS/expense text: "${smsText}"`;

    const result = await callGemini([{ text: prompt }]);
    if (result && result.amount > 0) return result;

    // Gemini topib bermasa regex ga fallback
    return parseSMSWithRegex(smsText);
  } catch (err) {
    console.error('Gemini SMS tahlilida xatolik:', err.message);
    return parseSMSWithRegex(smsText);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// To'lov cheki RASMINI Gemini Vision orqali tahlil qilish
// ─────────────────────────────────────────────────────────────────────────────
export async function parseReceiptImage(imageUrl) {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API Key topilmadi. Rasm tahlil qilib bo\'lmadi.');
    return null;
  }

  try {
    // 1. Rasmni yuklab olish va base64 ga aylantirish
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('Rasmni yuklab bo\'lishda xatolik');

    const buffer      = await imgRes.arrayBuffer();
    const base64Data  = Buffer.from(buffer).toString('base64');
    const mimeType    = imgRes.headers.get('content-type') || 'image/jpeg';

    // 2. Gemini Vision ga yuborish
    const prompt = `You are a financial assistant for Uzbekistan.
Look at this receipt/payment check image carefully and extract transaction data.
Return ONLY valid JSON, no explanation:
{"amount": number, "merchant": string, "category": string, "currency": "UZS"}

Rules:
- amount: total amount paid (number only, no currency symbol)
- merchant: store/restaurant/service name
- category: exactly one of "🛒 Oziq-ovqat", "🚗 Transport", "🍕 Restoran", "💊 Sog'liq", "🏠 Maishiy", "💡 Kommunal", "🎯 Boshqa"
- currency: always "UZS"
- If you cannot read the amount, return {"amount": 0, "merchant": "Noma'lum", "category": "🎯 Boshqa", "currency": "UZS"}`;

    const result = await callGemini([
      { text: prompt },
      {
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      },
    ]);

    return result;
  } catch (err) {
    console.error('Rasm tahlil qilishda xatolik:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Moliyaviy maslahat yaratish (AI Insights)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateAIInsights(userName, transactions, budgets, debts) {
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryTotals = {};
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });

  const categoryText = Object.entries(categoryTotals)
    .map(([cat, val]) => `- ${cat}: ${val.toLocaleString('uz-UZ')} UZS`)
    .join('\n');

  const unpaidDebts    = debts.filter(d => !d.is_paid);
  const owedToMe       = unpaidDebts.filter(d => d.type === 'owed').reduce((s, d) => s + Number(d.amount), 0);
  const owingToOthers  = unpaidDebts.filter(d => d.type === 'owing').reduce((s, d) => s + Number(d.amount), 0);
  const budgetLimits   = budgets.map(b => `- ${b.category}: ${Number(b.limit_amount).toLocaleString('uz-UZ')} UZS`).join('\n');

  if (!GEMINI_API_KEY) {
    return getFallbackInsight(userName, totalSpent, categoryTotals, owedToMe, owingToOthers);
  }

  try {
    const prompt = `You are Hamyon AI — an Uzbek personal finance advisor.
Give practical, friendly advice in Uzbek language (O'zbek tilida).
Consider Uzbekistan context: local markets (Chorsu, Oloy bozor), Bolt/Yandex taxi, Click/Payme payments, seasonal events (Navruz, Ramazon, wedding seasons "to'ylar").

User: ${userName || 'Foydalanuvchi'}
This month total spending: ${totalSpent.toLocaleString('uz-UZ')} UZS
Spending by category:
${categoryText || "Hali xarajatlar yo'q."}

Budget limits:
${budgetLimits || 'Budjet belgilab olinmagan.'}

Debts:
- People owe me: ${owedToMe.toLocaleString('uz-UZ')} UZS
- I owe others: ${owingToOthers.toLocaleString('uz-UZ')} UZS

Write 3-5 concise, actionable tips. Use emojis. Be specific, not generic.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API xatolik: ${res.status}`);

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackInsight(userName, totalSpent, categoryTotals, owedToMe, owingToOthers);
  } catch (err) {
    console.error('Gemini AI insights xatolik:', err.message);
    return getFallbackInsight(userName, totalSpent, categoryTotals, owedToMe, owingToOthers);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Oflayn fallback maslahat (API bo'lmasa)
// ─────────────────────────────────────────────────────────────────────────────
function getFallbackInsight(userName, totalSpent, categoryTotals, owedToMe, owingToOthers) {
  const tips = [
    `Assalomu alaykum, ${userName}! Hamyon AI sizning moliyaviy yordamchingiz. Xarajatlaringiz tahliliga ko'ra, bu oy jami ${totalSpent.toLocaleString('uz-UZ')} UZS sarfladingiz.`,
    `🚗 Transport xarajatlaringiz ko'payganga o'xshaydi. Agar taksi (Yandex/Bolt) uchun ko'p mablag' ketayotgan bo'lsa, metro yoki avtobus xizmatlaridan foydalanishni sinab ko'ring. Bu har oy kamida 200,000 - 350,000 UZS tejash imkonini beradi!`,
    `💡 Yaqinda to'ylar mavsumi boshlanmoqda. Milliy an'analarimizga ko'ra, to'y va to'yona xarajatlari uchun oldindan har oy 400,000 UZSdan ajratib borishingizni tavsiya qilamiz.`,
    `🛒 Oziq-ovqat uchun xarajatlarni kamaytirish uchun haftalik xaridlarni yirik bozorlarda (masalan, Chorsu yoki Oloy) ulgurji narxlarda qilish foydaliroq.`,
    owingToOthers > 0 ? `⚠️ Qarz daftaringizga ko'ra, boshqalardan ${owingToOthers.toLocaleString('uz-UZ')} UZS qarzingiz bor. Oylik kelishi bilan birinchi navbatda qarzni yopish moliyaviy barqarorlik garovidir!` : `✅ Ajoyib! Hozircha hech kimdan qarzingiz yo'q. Bu juda yaxshi ko'rsatkich.`,
    owedToMe > 0 ? `💰 Menga qaytarilishi kerak bo'lgan qarzlar miqdori: ${owedToMe.toLocaleString('uz-UZ')} UZS. Ularni qaytarish vaqtini muloyimlik bilan eslatib qo'yishingiz mumkin.` : ''
  ];
  return tips.filter(t => t !== '').join('\n\n');
}
