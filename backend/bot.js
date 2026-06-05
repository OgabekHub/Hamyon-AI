import TelegramBot from 'node-telegram-bot-api';
import { supabase } from './db.js';
import { parseSMSWithAI, generateAIInsights, parseReceiptImage } from './ai.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5173';

let bot;

// Foydalanuvchini bazada topish yoki yangi yaratish
async function getOrCreateUser(tgUser) {
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    console.error('Foydalanuvchini izlashda xatolik:', findError);
  }

  if (existingUser) {
    return existingUser;
  }

  // Yangi foydalanuvchi yaratish
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Foydalanuvchi';
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([
      {
        telegram_id: tgUser.id,
        name: name,
        monthly_budget: 0,
        currency: 'UZS'
      }
    ])
    .select()
    .single();

  if (createError) {
    console.error('Yangi foydalanuvchi qo\'shishda xatolik:', createError);
    return null;
  }

  return newUser;
}

export function startBot() {
  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN topilmadi. Bot ishga tushirilmadi.');
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    console.log('🚀 Telegram Bot polling rejimida muvaffaqiyatli ishga tushdi.');

    // /start buyrug'i
    bot.onText(/\/start/, async (msg) => {
      const tgUser = msg.from;
      const chatID = msg.chat.id;

      const user = await getOrCreateUser(tgUser);
      if (!user) {
        return bot.sendMessage(chatID, "Tizimga ulanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      }

      const welcomeMsg = `Assalomu alaykum, *${user.name}*! 👋\n\n` +
        `*Hamyon AI* botiga xush kelibsiz. Bu yerda siz o'z xarajatlaringizni aqlli boshqara olasiz.\n\n` +
        `⚙️ *Bot buyruqlari:*\n` +
        `/budget [summa] — Oylik budjet limitini belgilash (masalan: \`/budget 5000000\`)\n` +
        `/stats — Joriy oydagi qisqacha moliya statistikangiz\n` +
        `/debt — Qarz daftaringiz (kimdan qancha qarzsiz / kim sizdan qarz)\n` +
        `/report — Sun'iy intellektdan (AI) haftalik moliyaviy hisobot olish\n\n` +
        `📲 *Bank SMS-larini tahlil qilish:*\n` +
        `Uzcard, Humo yoki Kapitalbank SMS-larini menga yuboring (forward qiling). Men ularni avtomatik o'qib, tranzaksiyaga qo'shaman!\n\n` +
        `📸 *To'lov cheki rasmini yuborish:*\n` +
        `Do'kon yoki restorandan olgan chek rasmini menga yuboring! AI uni o'qib, xarajatni avtomatik qo'shadi.\n\n` +
        `👇 Moliyaviy boshqaruv panelini ochish uchun quyidagi tugmani bosing:`;

      const options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📱 Hamyon AI Dashboard',
                web_app: { url: miniAppUrl }
              }
            ]
          ]
        }
      };

      bot.sendMessage(chatID, welcomeMsg, options);
    });

    // /budget buyrug'i
    bot.onText(/\/budget(?:\s+(\d+))?/, async (msg, match) => {
      const tgUser = msg.from;
      const chatID = msg.chat.id;
      const amount = match[1];

      const user = await getOrCreateUser(tgUser);
      if (!user) return;

      if (!amount) {
        return bot.sendMessage(
          chatID,
          `Iltimos, oylik budjet miqdorini yuboring.\nMasalan: \`/budget 5000000\` (5 mln so'm belgilash uchun)`,
          { parse_mode: 'Markdown' }
        );
      }

      const budgetVal = parseFloat(amount);
      const { error } = await supabase
        .from('users')
        .update({ monthly_budget: budgetVal })
        .eq('id', user.id);

      if (error) {
        console.error('Budjet yangilashda xatolik:', error);
        return bot.sendMessage(chatID, 'Budjetingizni yangilashda xatolik yuz berdi.');
      }

      bot.sendMessage(
        chatID,
        `✅ Oylik umumiy budjetingiz *${budgetVal.toLocaleString('uz-UZ')} UZS* qilib belgilandi!`,
        { parse_mode: 'Markdown' }
      );
    });

    // /stats buyrug'i
    bot.onText(/\/stats/, async (msg) => {
      const tgUser = msg.from;
      const chatID = msg.chat.id;

      const user = await getOrCreateUser(tgUser);
      if (!user) return;

      // Hozirgi oy tranzaksiyalarini olish
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString());

      if (error) {
        console.error('Tranzaksiyalarni olishda xatolik:', error);
        return bot.sendMessage(chatID, 'Statistikani olishda xatolik yuz berdi.');
      }

      const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const categoryTotals = {};
      transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
      });

      let responseText = `📊 *Ushbu oydagi hisobot:*\n`;
      responseText += `Umumiy xarajat: *${totalSpent.toLocaleString('uz-UZ')} UZS*\n`;
      responseText += `Oylik budjet limit: *${Number(user.monthly_budget).toLocaleString('uz-UZ')} UZS*\n\n`;

      if (user.monthly_budget > 0) {
        const percent = Math.min((totalSpent / user.monthly_budget) * 100, 100).toFixed(1);
        responseText += `Budjet ishlatilishi: *${percent}%*\n`;
        if (totalSpent > user.monthly_budget) {
          responseText += `⚠️ *Ogohlantirish:* Budjetingiz *${(totalSpent - user.monthly_budget).toLocaleString('uz-UZ')} UZS* ga oshib ketdi!\n\n`;
        } else {
          responseText += `Qoldiq budjet: *${(user.monthly_budget - totalSpent).toLocaleString('uz-UZ')} UZS*\n\n`;
        }
      }

      responseText += `*Toifalar bo'yicha xarajatlar:*\n`;
      if (transactions.length === 0) {
        responseText += `_Bu oy hali tranzaksiyalar kiritilmadi._`;
      } else {
        Object.entries(categoryTotals).forEach(([cat, val]) => {
          responseText += `${cat}: *${val.toLocaleString('uz-UZ')} UZS*\n`;
        });
      }

      bot.sendMessage(chatID, responseText, { parse_mode: 'Markdown' });
    });

    // /debt buyrug'i
    bot.onText(/\/debt/, async (msg) => {
      const tgUser = msg.from;
      const chatID = msg.chat.id;

      const user = await getOrCreateUser(tgUser);
      if (!user) return;

      const { data: debts, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', false);

      if (error) {
        console.error('Qarzlarni olishda xatolik:', error);
        return bot.sendMessage(chatID, 'Qarz ma\'lumotlarini olishda xatolik yuz berdi.');
      }

      const owedToMe = debts.filter(d => d.type === 'owed');
      const owingToOthers = debts.filter(d => d.type === 'owing');

      let responseText = `📓 *Sizning Qarz Daftaringiz (Faol):*\n\n`;

      responseText += `💰 *Menga qaytarilishi kerak bo'lgan qarzlar (Owed):*\n`;
      if (owedToMe.length === 0) {
        responseText += `_Hech kimning sizdan qarzi yo'q._\n`;
      } else {
        owedToMe.forEach(d => {
          responseText += `- ${d.person_name}: *${Number(d.amount).toLocaleString('uz-UZ')} UZS*${d.due_date ? ` (Muddati: ${d.due_date})` : ''}\n`;
        });
      }

      responseText += `\n⚠️ *Men to'lashim kerak bo'lgan qarzlar (Owing):*\n`;
      if (owingToOthers.length === 0) {
        responseText += `_Sizning hech kimdan qarzingiz yo'q._\n`;
      } else {
        owingToOthers.forEach(d => {
          responseText += `- ${d.person_name}: *${Number(d.amount).toLocaleString('uz-UZ')} UZS*${d.due_date ? ` (Muddati: ${d.due_date})` : ''}\n`;
        });
      }

      bot.sendMessage(chatID, responseText, { parse_mode: 'Markdown' });
    });

    // /report buyrug'i
    bot.onText(/\/report/, async (msg) => {
      const tgUser = msg.from;
      const chatID = msg.chat.id;

      bot.sendMessage(chatID, '🧠 _AI shaxsiy moliyaviy hisobotingizni tayyorlamoqda... Iltimos kutib turing._', { parse_mode: 'Markdown' });

      const user = await getOrCreateUser(tgUser);
      if (!user) return;

      // Oxirgi 30 kunda kiritilgan barcha tranzaksiyalarni olish
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [txRes, budgetRes, debtRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', thirtyDaysAgo.toISOString()),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id).eq('is_paid', false)
      ]);

      if (txRes.error || budgetRes.error || debtRes.error) {
        console.error('Tizimdan ma\'lumotlarni olishda xatolik:', txRes.error, budgetRes.error, debtRes.error);
        return bot.sendMessage(chatID, 'Hisobot yaratishda xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
      }

      const insightText = await generateAIInsights(user.name, txRes.data, budgetRes.data, debtRes.data);
      
      // AI tahlilni bazada saqlash
      await supabase.from('ai_insights').insert([
        {
          user_id: user.id,
          insight_text: insightText
        }
      ]);

      bot.sendMessage(chatID, `🤖 *Hamyon AI maslahatlari:*\n\n${insightText}`, { parse_mode: 'Markdown' });
    });

    // ── 📸 RASM HANDLER: To'lov cheki va bank cheklari ──────────────────────
    bot.on('photo', async (msg) => {
      const chatID = msg.chat.id;
      const tgUser = msg.from;

      // Eng yuqori sifatli rasmni olish (oxirgisi — eng katta)
      const photos = msg.photo;
      const bestPhoto = photos[photos.length - 1];

      try {
        await bot.sendMessage(chatID,
          '📸 _Rasm qabul qilindi. AI chekni tahlil qilmoqda... Iltimos kuting._',
          { parse_mode: 'Markdown' }
        );

        // Telegram file URL ni olish
        const fileInfo = await bot.getFile(bestPhoto.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;

        const user = await getOrCreateUser(tgUser);
        if (!user) return;

        // Claude Vision bilan tahlil
        const parsedData = await parseReceiptImage(fileUrl);

        if (parsedData && parsedData.amount > 0) {
          const { amount, merchant, category } = parsedData;

          // Tranzaksiyani saqlash
          const caption = msg.caption || '';
          const { error: insertError } = await supabase
            .from('transactions')
            .insert([{
              user_id: user.id,
              amount,
              merchant,
              category,
              sms_raw: caption ? `📸 Rasm cheki: ${caption}` : '📸 Rasm cheki orqali kiritildi',
              date: new Date().toISOString()
            }]);

          if (insertError) {
            console.error('Rasm tranzaksiyasini saqlashda xatolik:', insertError);
            return bot.sendMessage(chatID, '❌ Tranzaksiyani saqlashda xatolik yuz berdi.');
          }

          // Tasdiqlash xabari
          const confirmMsg =
            `✅ *Chek muvaffaqiyatli tahlil qilindi!*\n\n` +
            `💰 Summa: *${amount.toLocaleString('uz-UZ')} UZS*\n` +
            `🛒 Joy: *${merchant}*\n` +
            `📁 Toifa: *${category}*\n` +
            `📅 Sana: *${new Date().toLocaleDateString('uz-UZ')}*\n\n` +
            `_Xarajat dashboardga qo'shildi!_ 📊`;

          await bot.sendMessage(chatID, confirmMsg, { parse_mode: 'Markdown' });

          // Budjet limitini tekshirish
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: monthlyTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', startOfMonth.toISOString());

          const totalSpent = (monthlyTransactions || []).reduce((s, t) => s + Number(t.amount), 0);

          if (user.monthly_budget > 0 && totalSpent > user.monthly_budget) {
            setTimeout(() => {
              bot.sendMessage(chatID,
                `⚠️ *DIQQAT! Oylik budjet limitingiz oshib ketdi!*\n` +
                `Sarflangan: *${totalSpent.toLocaleString('uz-UZ')} UZS* / Limit: *${Number(user.monthly_budget).toLocaleString('uz-UZ')} UZS*`,
                { parse_mode: 'Markdown' }
              );
            }, 1000);
          }

        } else {
          // Claude Vision chekdan ma'lumot topib bermadi
          await bot.sendMessage(chatID,
            `❌ *Chekdan ma'lumot topib bo'lmadi.*\n\n` +
            `Buning sabablari:\n` +
            `• Rasm sifati past yoki xiralashgan\n` +
            `• Chekdagi yozuvlar ko'rinmayapti\n` +
            `• Bu to'lov cheki bo'lmasligi mumkin\n\n` +
            `💡 *Nima qilish mumkin:*\n` +
            `1. Rasmni aniqroq (fokusda) qayta oling\n` +
            `2. Chek matnini botga yozing yoki forward qiling\n` +
            `3. Dashboard orqali qo'lda kiriting`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (err) {
        console.error('Photo handler xatolik:', err);
        bot.sendMessage(chatID, '❌ Rasmni qayta ishlashda texnik xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
      }
    });

    // ── 💬 MATNLI XABARLAR VA SMS FORWARDLAR ─────────────────────────────────
    bot.on('message', async (msg) => {
      // Agar xabar buyruq bo'lsa, uni yuborgan command handlerlar o'zi javob beradi
      if (msg.text && msg.text.startsWith('/')) return;

      const chatID = msg.chat.id;
      const text = msg.text || msg.caption;
      if (!text) return;

      // SMS yoki oddiy xarajat matni bo'lishi mumkin bo'lgan kalit so'zlarni tekshirish
      const isSMS = text.toLowerCase().includes('uzcard') ||
                    text.toLowerCase().includes('humo') ||
                    text.toLowerCase().includes('to\'lov') ||
                    text.toLowerCase().includes('savdo') ||
                    text.toLowerCase().includes('balans') ||
                    text.toLowerCase().includes('qoldiq') ||
                    text.toLowerCase().includes('to\'landi') ||
                    text.toLowerCase().includes('so\'m') ||
                    text.toLowerCase().includes('som') ||
                    text.toLowerCase().includes('uzs') ||
                    text.toLowerCase().includes('ketdi') ||
                    text.toLowerCase().includes('xarajat') ||
                    /\d+/.test(text);

      if (isSMS) {
        bot.sendMessage(chatID, '🔍 _Xabar matni aniqlandi. AI uni tahlil qilmoqda..._', { parse_mode: 'Markdown' });

        const tgUser = msg.from;
        const user = await getOrCreateUser(tgUser);
        if (!user) return;

        const parsedData = await parseSMSWithAI(text);
        
        if (parsedData && parsedData.amount > 0) {
          const { amount, merchant, category } = parsedData;
          
          // Tranzaksiyani saqlash
          const { error: insertError } = await supabase
            .from('transactions')
            .insert([
              {
                user_id: user.id,
                amount,
                merchant,
                category,
                sms_raw: text,
                date: new Date().toISOString()
              }
            ]);

          if (insertError) {
            console.error('Tranzaksiyani saqlashda xatolik:', insertError);
            return bot.sendMessage(chatID, '❌ Tranzaksiyani saqlashda xatolik yuz berdi.');
          }

          // Xabarni yuborish
          let confirmMsg = `✅ *Yangi tranzaksiya saqlandi!*\n\n` +
            `💰 Summa: *${amount.toLocaleString('uz-UZ')} UZS*\n` +
            `🛒 Joy: *${merchant}*\n` +
            `📁 Toifa: *${category}*\n` +
            `📅 Sana: *${new Date().toLocaleDateString('uz-UZ')}*`;

          await bot.sendMessage(chatID, confirmMsg, { parse_mode: 'Markdown' });

          // Budjet limitini tekshirish
          // Joriy oydagi umumiy xarajat
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: monthlyTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', startOfMonth.toISOString());

          const totalSpent = (monthlyTransactions || []).reduce((sum, t) => sum + Number(t.amount), 0);

          if (user.monthly_budget > 0 && totalSpent > user.monthly_budget) {
            const limitExceeded = totalSpent - user.monthly_budget;
            const alertMsg = `⚠️ *DIQQAT! Budjet limiti buzildi!*\n\n` +
              `Siz belgilagan oylik umumiy budjet: *${Number(user.monthly_budget).toLocaleString('uz-UZ')} UZS*.\n` +
              `Joriy oydagi umumiy xarajatlaringiz: *${totalSpent.toLocaleString('uz-UZ')} UZS*.\n` +
              `Budjet chegarasidan *${limitExceeded.toLocaleString('uz-UZ')} UZS* oshib ketdingiz! 📉`;
            
            setTimeout(() => {
              bot.sendMessage(chatID, alertMsg, { parse_mode: 'Markdown' });
            }, 1000);
          } else {
            // Muayyan toifa budjetini tekshirish (agar alohida cheklov belgilangan bo'lsa)
            const currentYearMonth = new Date().toISOString().substring(0, 7);
            const { data: budgetLimits } = await supabase
              .from('budgets')
              .select('limit_amount')
              .eq('user_id', user.id)
              .eq('category', category)
              .eq('month', currentYearMonth)
              .single();

            if (budgetLimits && budgetLimits.limit_amount > 0) {
              const { data: categoryTransactions } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('category', category)
                .gte('date', startOfMonth.toISOString());

              const catSpent = (categoryTransactions || []).reduce((sum, t) => sum + Number(t.amount), 0);

              if (catSpent > budgetLimits.limit_amount) {
                const catLimitExceeded = catSpent - budgetLimits.limit_amount;
                const catAlertMsg = `⚠️ *DIQQAT! ${category} toifasi budjeti buzildi!*\n\n` +
                  `Ushbu toifa uchun limit: *${Number(budgetLimits.limit_amount).toLocaleString('uz-UZ')} UZS*.\n` +
                  `Sarflangan mablag': *${catSpent.toLocaleString('uz-UZ')} UZS*.\n` +
                  `Belgilangan limitdan *${catLimitExceeded.toLocaleString('uz-UZ')} UZS* oshib ketdingiz!`;

                setTimeout(() => {
                  bot.sendMessage(chatID, catAlertMsg, { parse_mode: 'Markdown' });
                }, 1000);
              }
            }
          }

        } else {
          bot.sendMessage(chatID, "❌ Kechirasiz, ushbu matndan tranzaksiya ma'lumotlarini aniqlab bo'lmadi.");
        }
      } else {
        const guidanceMsg = `⚠️ *Kechirasiz, bu xabar bank SMS-xabariga yoki xarajat qaydiga o'xshamaydi.*\n\n` +
          `Men banklardan keladigan SMS-xabarlarni yoki oddiy yozilgan xarajatlarni (masalan: *“Transportga 15000 so'm ketdi”*) avtomat tahlil qila olaman.\n\n` +
          `💡 *Siz nima qila olasiz:*\n` +
          `1. Bankdan kelgan to'liq SMS matnini yo'naltiring (forward qiling).\n` +
          `2. Oddiy xarajat yozsangiz, unda albatta summa (raqamlar bilan) va kalit so'zlar bo'lishi kerak.\n` +
          `3. Yoki pastdagi *Hamyon AI Dashboard* tugmasini bosing va xarajatni Mini Ilova orqali qo'lda qo'shing.`;
        
        bot.sendMessage(chatID, guidanceMsg, { parse_mode: 'Markdown' });
      }
    });

  } catch (err) {
    console.error('Botni ishga tushirishda xatolik:', err);
  }

  return bot;
}

// Tashqaridan xabar jo'natish funksiyasi (Express server orqali ogohlantirishlar yuborish uchun)
export async function sendTelegramMessage(telegramId, text, options = {}) {
  if (bot && telegramId) {
    try {
      return await bot.sendMessage(telegramId, text, options);
    } catch (error) {
      console.error(`Telegram xabari yuborishda xatolik (${telegramId}):`, error);
    }
  }
  return null;
}
