import dotenv from 'dotenv';

dotenv.config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

// Oflayn/Fallback rejim uchun tranzaksiyani toifalash
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

// Regex orqali tezkor SMS tahlili (fallback)
export function parseSMSWithRegex(smsText) {
  // Uzcard. Savdo: Korzinka 45000 UZS. Qoldiq: 120000 UZS
  const uzcardRegex = /Uzcard\.\s+Savdo:\s+(.+?)\s+([\d\s,]+)\s*UZS\.\s+Qoldiq:\s*([\d\s,]+)\s*UZS/i;
  // HUMO. To'lov: Yandex Go 15000 UZS. Balans: 120000 UZS
  const humoRegex = /HUMO\.\s+To'lov:\s+(.+?)\s+([\d\s,]+)\s*UZS\.\s+Balans:\s*([\d\s,]+)\s*UZS/i;
  // 50000 UZS Texnomart uchun to'landi
  const kapitalRegex = /([\d\s,]+)\s*UZS\s+(.+?)\s+uchun\s+to'landi/i;

  let merchant = '';
  let amount = 0;

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
    return {
      amount,
      merchant,
      category: autoCategorize(merchant),
      currency: 'UZS'
    };
  }

  return null;
}

// ─── Rasm orqali chek tahlili (Claude Vision) ───────────────────────────────

/**
 * To'lov cheki yoki bank cheki rasmini Claude Vision AI orqali tahlil qiladi.
 * @param {string} imageUrl - Telegram file URL
 * @returns {{ amount, merchant, category, currency } | null}
 */
export async function parseReceiptImage(imageUrl) {
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'your_claude_api_key_here') {
    console.log('Claude API Key topilmadi. Rasm tahlil qilib bo\'lmadi.');
    return null;
  }

  try {
    // 1. Rasmni URL dan yuklab olish (buffer)
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error('Rasmni yuklab bo\'lishda xatolik');

    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // Content-type aniqlash
    const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';

    // 2. Claude Vision API ga yuborish
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: `You are a financial assistant for Uzbekistan. 
Analyze receipt/payment check images and extract transaction data.
Return ONLY valid JSON (no markdown, no explanation):
{"amount": number, "merchant": string, "category": string, "currency": "UZS"}

Category must be one of: "🛒 Oziq-ovqat", "🚗 Transport", "🍕 Restoran", "💊 Sog'liq", "🏠 Maishiy", "💡 Kommunal", "🎯 Boshqa"

If you cannot extract amount from the image, return: {"amount": 0, "merchant": "Noma'lum", "category": "🎯 Boshqa", "currency": "UZS"}`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'Bu to\'lov cheki yoki bank cheki rasmidan tranzaksiya ma\'lumotlarini (summa, do\'kon/joy, toifa) JSON formatida ajratib ber. Summani UZS da yoz.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Claude Vision API xatolik: ${response.status} — ${errBody}`);
    }

    const data = await response.json();
    const replyText = data.content[0].text.trim();

    // JSON ni tozalash
    const jsonMatch = replyText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(replyText);
  } catch (error) {
    console.error('Rasm tahlil qilishda xatolik:', error.message);
    return null;
  }
}

// ─── Claude API orqali matnni tahlil qilish ─────────────────────────────────
export async function parseSMSWithAI(smsText) {
  if (!CLAUDE_API_KEY) {
    console.log('Claude API Key topilmadi. Regex tahlilidan foydalanilmoqda...');
    return parseSMSWithRegex(smsText);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        system: "You are a financial assistant for Uzbekistan. Parse bank SMS and return JSON only. Return: {amount: number, merchant: string, category: string, currency: 'UZS'}. Make sure category matches one of: '🛒 Oziq-ovqat', '🚗 Transport', '🍕 Restoran', '💊 Sog\\'liq', '🏠 Maishiy', '💡 Kommunal', '🎯 Boshqa'.",
        messages: [
          { role: 'user', content: `Quyidagi SMS matnini tahlil qil va JSON formatida javob ber:\n"${smsText}"` }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.content[0].text;
    
    // JSON-ni tozalash (ba'zida Claude ```json ... ``` bilan qaytaradi)
    const jsonMatch = replyText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(replyText);
  } catch (error) {
    console.error('Claude API orqali tahlil qilishda xatolik:', error);
    return parseSMSWithRegex(smsText);
  }
}

// Claude API orqali moliyaviy maslahat yaratish
export async function generateAIInsights(userName, transactions, budgets, debts) {
  // Tranzaksiyalar matn ko'rinishida yig'iladi
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Toifalar bo'yicha xarajatlar
  const categoryTotals = {};
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });

  const categoryText = Object.entries(categoryTotals)
    .map(([cat, val]) => `- ${cat}: ${val.toLocaleString('uz-UZ')} UZS`)
    .join('\n');

  // Qarzlar haqida ma'lumot
  const unpaidDebts = debts.filter(d => !d.is_paid);
  const owedToMe = unpaidDebts.filter(d => d.type === 'owed').reduce((sum, d) => sum + Number(d.amount), 0);
  const owingToOthers = unpaidDebts.filter(d => d.type === 'owing').reduce((sum, d) => sum + Number(d.amount), 0);

  // Budjetlar chegaralari
  const budgetLimits = budgets.map(b => `- ${b.category}: ${Number(b.limit_amount).toLocaleString('uz-UZ')} UZS`).join('\n');

  const userContext = `
Foydalanuvchi ismi: ${userName || 'Jasur'}
Ushbu oydagi umumiy xarajat: ${totalSpent.toLocaleString('uz-UZ')} UZS.
Toifalar bo'yicha xarajatlar:
${categoryText || "Hali xarajatlar yo'q."}

Budjet chegaralari:
${budgetLimits || 'Budjet belgilab olinmagan.'}

Qarz daftari (Qoldiqlar):
- Menga qaytarishlari kerak bo'lgan qarzlar: ${owedToMe.toLocaleString('uz-UZ')} UZS
- Men to'lashim kerak bo'lgan qarzlar: ${owingToOthers.toLocaleString('uz-UZ')} UZS
`;

  // Claude API kaliti bo'lmasa fallback o'zbekcha maslahat berish
  if (!CLAUDE_API_KEY) {
    console.log('Claude API Key topilmadi. Oflayn AI maslahat tayyorlanmoqda...');
    return getFallbackInsight(userName, totalSpent, categoryTotals, owedToMe, owingToOthers);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: `You are Hamyon AI — an Uzbek personal finance advisor.
Give advice in Uzbek language. Consider local context:
- Uzbek holidays (Ramazon, Navruz, wedding seasons, Eid)
- Common spending patterns in Uzbekistan (e.g. gap, osh, to'ylar, bozor-o'char)
- Practical money-saving tips for Uzbekistan (e.g. using public transport, buying in bulk at bazaar like Oloy/Chorsu)
Be concise, friendly, actionable, and structured with emoji. Do not use generic placeholders.`,
        messages: [
          { role: 'user', content: `Quyidagi foydalanuvchi moliya ma'lumotlari asosida o'zbekona tahlil va maslahatlar yozib ber:\n${userContext}` }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API maslahat yaratishda xatolik:', error);
    return getFallbackInsight(userName, totalSpent, categoryTotals, owedToMe, owingToOthers);
  }
}

// Mahalliy algoritmlar bo'yicha maslahat tayyorlash (Claude bo'lmasa yoki xatolik yuz bersa)
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
