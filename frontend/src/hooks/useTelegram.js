import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useTelegram() {
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#0f172a');
        tg.setBackgroundColor('#0f172a');
      } catch (e) {
        console.warn('Failed to set Telegram colors:', e);
      }

      const tgUser = tg.initDataUnsafe?.user;
      const rawData = tg.initData;

      if (tgUser && rawData) {
        setUser({
          id: tgUser.id,
          name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Foydalanuvchi',
          username: tgUser.username,
        });
        setInitData(rawData);
        setLoading(false);
        return;
      }
    }

    // Dev Fallback (Lokal brauzerda test qilish)
    const urlParams = new URLSearchParams(window.location.search);
    const queryTelegramId = urlParams.get('telegram_id');
    const devUserId = queryTelegramId ? parseInt(queryTelegramId) : 123456789;
    
    setUser({
      id: devUserId,
      name: queryTelegramId ? 'Jasur' : 'Jasur (Lokal)',
      username: 'jasur_dev',
    });
    setInitData(`query_id=mock&user=${encodeURIComponent(JSON.stringify({ id: devUserId, first_name: queryTelegramId ? 'Jasur' : 'Jasur', username: 'jasur_dev' }))}&auth_date=12345&hash=mock`);
    setLoading(false);
  }, []);

  // Oflayn rejim (LocalStorage) uchun boshlang'ich yordamchi ma'lumotlar
  const getLocalStorageData = (key, defaultValue) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  };

  const setLocalStorageData = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `tma ${initData}`,
      'x-telegram-id': user?.id ? String(user.id) : '',
      'x-telegram-name': user?.name ? String(user.name) : '',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Tarmoq xatosi: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.warn(`Backend ulanishida xatolik yuz berdi (${error.message}). Oflayn rejim (LocalStorage) faollashtirildi.`);
      
      // ----------------- OFLAYN FALLBACK LOGIKASI -----------------
      const urlPath = endpoint.split('?')[0];

      // 1. Auth / Profil
      if (urlPath === '/api/auth') {
        const localProfile = getLocalStorageData('hamyon_user_profile', {
          id: 'dev-user-uuid-1234',
          telegram_id: user?.id || 123456789,
          name: user?.name || 'Jasur',
          monthly_budget: 5000000,
          currency: 'UZS'
        });
        return localProfile;
      }

      // 2. Oylik Budjetni yangilash
      if (urlPath === '/api/user/budget' && options.method === 'POST') {
        const { monthly_budget } = JSON.parse(options.body);
        const profile = getLocalStorageData('hamyon_user_profile', {
          id: 'dev-user-uuid-1234',
          telegram_id: user?.id || 123456789,
          name: user?.name || 'Jasur',
          monthly_budget: 5000000,
          currency: 'UZS'
        });
        profile.monthly_budget = Number(monthly_budget);
        setLocalStorageData('hamyon_user_profile', profile);
        return profile;
      }

      // 3. Tranzaksiyalar
      if (urlPath === '/api/transactions') {
        let transactions = getLocalStorageData('hamyon_transactions', [
          { id: '1', user_id: 'dev-user-uuid-1234', amount: 2000000, merchant: 'Korzinka Supermarket', category: '🛒 Oziq-ovqat', date: new Date(Date.now() - 172800000).toISOString() },
          { id: '2', user_id: 'dev-user-uuid-1234', amount: 1250000, merchant: 'Evos Olay', category: '🍕 Restoran', date: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', user_id: 'dev-user-uuid-1234', amount: 620000, merchant: 'Bolt Taxi', category: '🚗 Transport', date: new Date().toISOString() },
          { id: '4', user_id: 'dev-user-uuid-1234', amount: 500000, merchant: 'Texnomart (Mebel)', category: '🏠 Maishiy', date: new Date(Date.now() - 259200000).toISOString() },
          { id: '5', user_id: 'dev-user-uuid-1234', amount: 250000, merchant: 'Click (Svet to\'lovi)', category: '💡 Kommunal', date: new Date(Date.now() - 345600000).toISOString() }
        ]);

        if (options.method === 'POST') {
          const newTx = JSON.parse(options.body);
          const createdTx = {
            id: Math.random().toString(36).substring(2, 11),
            user_id: 'dev-user-uuid-1234',
            amount: Number(newTx.amount),
            merchant: newTx.merchant || 'Qo\'lda kiritildi',
            category: newTx.category || '🎯 Boshqa',
            date: newTx.date || new Date().toISOString()
          };
          transactions.unshift(createdTx);
          setLocalStorageData('hamyon_transactions', transactions);
          return createdTx;
        }

        return transactions;
      }

      // Tranzaksiyani o'chirish
      if (urlPath.startsWith('/api/transactions/') && options.method === 'DELETE') {
        const idToDelete = urlPath.split('/').pop();
        let transactions = getLocalStorageData('hamyon_transactions', []);
        transactions = transactions.filter(t => t.id !== idToDelete);
        setLocalStorageData('hamyon_transactions', transactions);
        return { message: 'Tranzaksiya o\'chirildi' };
      }

      // 4. Budjet chegaralari
      if (urlPath === '/api/budgets') {
        const currentMonth = new Date().toISOString().substring(0, 7);
        let budgets = getLocalStorageData('hamyon_budgets', [
          { id: 'b1', user_id: 'dev-user-uuid-1234', category: '🚗 Transport', limit_amount: 500000, month: currentMonth },
          { id: 'b2', user_id: 'dev-user-uuid-1234', category: '🛒 Oziq-ovqat', limit_amount: 2000000, month: currentMonth },
          { id: 'b3', user_id: 'dev-user-uuid-1234', category: '🍕 Restoran', limit_amount: 1000000, month: currentMonth }
        ]);

        if (options.method === 'POST') {
          const newBudget = JSON.parse(options.body);
          const index = budgets.findIndex(b => b.category === newBudget.category && b.month === currentMonth);
          if (index > -1) {
            budgets[index].limit_amount = Number(newBudget.limit_amount);
          } else {
            budgets.push({
              id: Math.random().toString(36).substring(2, 11),
              user_id: 'dev-user-uuid-1234',
              category: newBudget.category,
              limit_amount: Number(newBudget.limit_amount),
              month: currentMonth
            });
          }
          setLocalStorageData('hamyon_budgets', budgets);
          return newBudget;
        }

        return budgets;
      }

      // 5. Qarzlar
      if (urlPath === '/api/debts') {
        let debts = getLocalStorageData('hamyon_debts', [
          { id: 'd1', user_id: 'dev-user-uuid-1234', person_name: 'Davron (akasi)', amount: 400000, type: 'owing', is_paid: false, created_at: new Date().toISOString() },
          { id: 'd2', user_id: 'dev-user-uuid-1234', person_name: 'Sardor (do\'sti)', amount: 300000, type: 'owed', is_paid: false, created_at: new Date().toISOString() }
        ]);

        if (options.method === 'POST') {
          const newDebt = JSON.parse(options.body);
          const createdDebt = {
            id: Math.random().toString(36).substring(2, 11),
            user_id: 'dev-user-uuid-1234',
            person_name: newDebt.person_name,
            amount: Number(newDebt.amount),
            type: newDebt.type,
            due_date: newDebt.due_date || null,
            is_paid: false,
            created_at: new Date().toISOString()
          };
          debts.unshift(createdDebt);
          setLocalStorageData('hamyon_debts', debts);
          return createdDebt;
        }

        return debts;
      }

      // Qarzni to'langan deb belgilash
      if (urlPath.startsWith('/api/debts/') && options.method === 'PATCH') {
        const debtId = urlPath.split('/').pop();
        const { is_paid } = JSON.parse(options.body);
        let debts = getLocalStorageData('hamyon_debts', []);
        const index = debts.findIndex(d => d.id === debtId);
        if (index > -1) {
          debts[index].is_paid = is_paid;
          setLocalStorageData('hamyon_debts', debts);
          return debts[index];
        }
        return {};
      }

      // Qarzni o'chirish
      if (urlPath.startsWith('/api/debts/') && options.method === 'DELETE') {
        const idToDelete = urlPath.split('/').pop();
        let debts = getLocalStorageData('hamyon_debts', []);
        debts = debts.filter(d => d.id !== idToDelete);
        setLocalStorageData('hamyon_debts', debts);
        return { message: 'Qarz yozuvi o\'chirildi' };
      }

      // 6. AI Insights
      if (urlPath === '/api/insights') {
        return getLocalStorageData('hamyon_ai_insight', {
          id: 'i1',
          user_id: 'dev-user-uuid-1234',
          insight_text: `🤖 **Hamyon AI Tahlili:**
    
Assalomu alaykum, Jasur! Moliya holatingizni tahlil qildim:

🚗 **Transport:** Bu oy taksi (Bolt) uchun jami **620,000 UZS** sarfladingiz. Bu siz belgilagan 500,000 UZS limitdan **24% (120,000 UZS) ko'p**! Kelgusi haftalarda jamoat transportidan foydalanishni tavsiya qilaman.

🛒 **Oziq-ovqat:** Korzinkada 2,000,000 UZS sarflandi. Haftalik xaridlarni Chorsu bozoridan ulgurji narxlarda qilish orqali yana 300,000 UZS tejashingiz mumkin.

💡 **O'zbekona maslahat:** Yaqin oylarda yurtimizda to'ylar mavsumi qizg'in pallaga kiradi. To'y va to'yonalar uchun hozirdan oylik daromadingizdan kamida 500,000 UZS jamg'arib borishni boshlang.`,
          generated_at: new Date().toISOString()
        });
      }

      // AI insight generatsiya qilish
      if (urlPath === '/api/insights/generate' && options.method === 'POST') {
        const profile = getLocalStorageData('hamyon_user_profile', { monthly_budget: 5000000 });
        const transactions = getLocalStorageData('hamyon_transactions', []);
        const debts = getLocalStorageData('hamyon_debts', []);
        
        const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const unpaidDebts = debts.filter(d => !d.is_paid);
        const owedToMe = unpaidDebts.filter(d => d.type === 'owed').reduce((sum, d) => sum + Number(d.amount), 0);
        const owingToOthers = unpaidDebts.filter(d => d.type === 'owing').reduce((sum, d) => sum + Number(d.amount), 0);

        const newInsightText = `🤖 **Hamyon AI Tahlili (Yangilandi):**
    
Assalomu alaykum! Xarajatlaringiz va qarz daftaringiz muvaffaqiyatli tahlil qilindi:

📉 **Umumiy xarajat:** Joriy oyda jami **${totalSpent.toLocaleString('uz-UZ')} UZS** sarfladingiz. Oylik budjetingiz **${profile.monthly_budget.toLocaleString('uz-UZ')} UZS** ni tashkil etadi.

📓 **Qarzlar:** Boshqalardan **${owingToOthers.toLocaleString('uz-UZ')} UZS** qarzingiz bor va sizdan **${owedToMe.toLocaleString('uz-UZ')} UZS** qarz bo'lgan do'stlaringiz bor.

💡 **O'zbekona tavsiya:** Haftalik rejalashtirish orqali ortiqcha taksi va kafe xarajatlarini 15% gacha qisqartira olasiz. Ramazon oyi arafasida yoki bayramlarda bozor-o'charni oldindan rejalashtiring!`;

        const newInsight = {
          id: Math.random().toString(36).substring(2, 11),
          user_id: 'dev-user-uuid-1234',
          insight_text: newInsightText,
          generated_at: new Date().toISOString()
        };
        setLocalStorageData('hamyon_ai_insight', newInsight);
        return newInsight;
      }

      return {};
    }
  };

  const triggerHaptic = (action, styleOrType) => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (action === 'impact') {
        tg.HapticFeedback.impactOccurred(styleOrType || 'light');
      } else if (action === 'notification') {
        tg.HapticFeedback.notificationOccurred(styleOrType || 'success');
      } else if (action === 'selection') {
        tg.HapticFeedback.selectionChanged();
      }
    } catch (e) {
      console.warn("Haptic feedback failed:", e);
    }
  };

  return { user, initData, loading, fetchWithAuth, triggerHaptic };
}
