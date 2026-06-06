import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './db.js';
import { startBot } from './bot.js';
import { authMiddleware } from './middleware/auth.js';
import { generateAIInsights, askAIChat } from './ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Foydalanuvchini bazada tekshirish va uni req.dbUser ga qo'shish
async function dbUserMiddleware(req, res, next) {
  const telegram_id = req.user.id;
  try {
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Foydalanuvchi topilmasa bazada yangi ochamiz
      const name = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ') || req.user.username || 'Foydalanuvchi';
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ telegram_id, name }])
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    } else if (error) {
      throw error;
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.error('dbUserMiddleware da xatolik:', err);
    res.status(500).json({ error: 'Foydalanuvchi ma\'lumotlarini bazadan olishda xatolik' });
  }
}

// ----------------- API MARSHRUTLARI -----------------

// Foydalanuvchi ma'lumotlarini olish (profil)
app.get('/api/auth', authMiddleware, dbUserMiddleware, (req, res) => {
  res.json(req.dbUser);
});

// Oylik umumiy budjetni yangilash
app.post('/api/user/budget', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { monthly_budget } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ monthly_budget })
      .eq('id', req.dbUser.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Tranzaksiyalar (Xarajatlar/Daromadlar) API
app.get('/api/transactions', authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.dbUser.id)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { amount, merchant, category, date, sms_raw } = req.body;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: req.dbUser.id,
          amount,
          merchant: merchant || 'Qo\'lda kiritildi',
          category: category || '🎯 Boshqa',
          date: date || new Date().toISOString(),
          sms_raw: sms_raw || null
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/transactions/:id', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.dbUser.id);

    if (error) throw error;
    res.json({ message: 'Tranzaksiya muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toifalar bo'yicha budjet cheklovlari API (Budgets)
app.get('/api/budgets', authMiddleware, dbUserMiddleware, async (req, res) => {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.dbUser.id)
      .eq('month', currentMonth);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { category, limit_amount } = req.body;
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  try {
    // Agar toifa uchun budjet mavjud bo'lsa uni yangilaydi (upsert)
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: req.dbUser.id,
        category,
        limit_amount,
        month: currentMonth
      }, { onConflict: 'user_id, category, month' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Qarz Daftari API (Debts)
app.get('/api/debts', authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', req.dbUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debts', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { person_name, amount, type, due_date } = req.body;

  try {
    const { data, error } = await supabase
      .from('debts')
      .insert([
        {
          user_id: req.dbUser.id,
          person_name,
          amount,
          type,
          due_date: due_date || null,
          is_paid: false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/debts/:id', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { id } = req.params;
  const { is_paid } = req.body;

  try {
    const { data, error } = await supabase
      .from('debts')
      .update({ is_paid })
      .eq('id', id)
      .eq('user_id', req.dbUser.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/debts/:id', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.dbUser.id);

    if (error) throw error;
    res.json({ message: 'Qarz yozuvi muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI Insights API
app.get('/api/insights', authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', req.dbUser.id)
      .order('generated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json(data[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/insights/generate', authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    // Hisobot yaratish uchun oxirgi 30 kunlik tranzaksiyalar va boshqa ma'lumotlarni yig'amiz
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [txRes, budgetRes, debtRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', req.dbUser.id).gte('date', thirtyDaysAgo.toISOString()),
      supabase.from('budgets').select('*').eq('user_id', req.dbUser.id),
      supabase.from('debts').select('*').eq('user_id', req.dbUser.id).eq('is_paid', false)
    ]);

    if (txRes.error) throw txRes.error;
    if (budgetRes.error) throw budgetRes.error;
    if (debtRes.error) throw debtRes.error;

    const insightText = await generateAIInsights(req.dbUser.name, txRes.data, budgetRes.data, debtRes.data);

    const { data: newInsight, error: insertError } = await supabase
      .from('ai_insights')
      .insert([
        {
          user_id: req.dbUser.id,
          insight_text: insightText
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;
    res.json(newInsight);
  } catch (error) {
    console.error('Generate Insights API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/insights/chat', authMiddleware, dbUserMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Xabar matni yuborilmadi (message is required)' });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [txRes, budgetRes, debtRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', req.dbUser.id).gte('date', thirtyDaysAgo.toISOString()),
      supabase.from('budgets').select('*').eq('user_id', req.dbUser.id),
      supabase.from('debts').select('*').eq('user_id', req.dbUser.id).eq('is_paid', false)
    ]);

    if (txRes.error) throw txRes.error;
    if (budgetRes.error) throw budgetRes.error;
    if (debtRes.error) throw debtRes.error;

    const responseText = await askAIChat(req.dbUser.name, message, txRes.data, budgetRes.data, debtRes.data);
    res.json({ response: responseText });
  } catch (error) {
    console.error('Chat Insights API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Express serverni va Telegram Botni ishga tushirish
app.listen(PORT, () => {
  console.log(`📡 Express server http://localhost:${PORT} portida ishlamoqda.`);
  startBot();
});
