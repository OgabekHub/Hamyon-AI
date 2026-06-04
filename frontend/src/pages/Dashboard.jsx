import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Plus, Edit2, Trash2, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { name: '🛒 Oziq-ovqat', color: '#10b981' }, // success
  { name: '🚗 Transport', color: '#38bdf8' }, // primary
  { name: '🍕 Restoran', color: '#f59e0b' },   // warning
  { name: '💊 Sog\'liq', color: '#f43f5e' },   // rose
  { name: '🏠 Maishiy', color: '#a855f7' },    // purple
  { name: '💡 Kommunal', color: '#eab308' },   // yellow
  { name: '🎯 Boshqa', color: '#64748b' }      // slate
];

export default function Dashboard({ fetchWithAuth, user, setActiveTab }) {
  const [transactions, setTransactions] = useState([]);
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txs, profile] = await Promise.all([
        fetchWithAuth('/api/transactions'),
        fetchWithAuth('/api/auth')
      ]);
      setTransactions(txs);
      setUserData(profile);
      setNewBudget(profile.monthly_budget || '');
    } catch (err) {
      console.error('Ma\'lumot yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      const payload = {
        amount: parseFloat(amount),
        merchant,
        category,
        date: new Date().toISOString()
      };
      await fetchWithAuth('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowAddModal(false);
      setAmount('');
      setMerchant('');
      setCategory(CATEGORIES[0].name);
      loadData();
    } catch (err) {
      console.error('Qo\'shishda xatolik:', err);
      alert('Tranzaksiya qo\'shib bo\'lmadi');
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      const budgetVal = parseFloat(newBudget) || 0;
      await fetchWithAuth('/api/user/budget', {
        method: 'POST',
        body: JSON.stringify({ monthly_budget: budgetVal })
      });
      setShowBudgetModal(false);
      loadData();
    } catch (err) {
      console.error('Budjetni saqlashda xatolik:', err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Ushbu tranzaksiyani o\'chirmoqchimisiz?')) return;
    try {
      await fetchWithAuth(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (err) {
      console.error('O\'chirishda xatolik:', err);
    }
  };

  // Joriy oydagi tranzaksiyalar filteri
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyTxs = transactions.filter(t => t.date.substring(0, 7) === currentMonthStr);
  const totalSpent = monthlyTxs.reduce((sum, t) => sum + Number(t.amount), 0);

  // Recharts uchun ma'lumot tayyorlash
  const categoryTotals = {};
  monthlyTxs.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });

  const chartData = Object.entries(categoryTotals).map(([name, value]) => {
    const catObj = CATEGORIES.find(c => c.name === name) || { color: '#64748b' };
    return { name, value, color: catObj.color };
  });

  const budgetLimit = Number(userData?.monthly_budget || 0);
  const percentSpent = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const remainingBudget = Math.max(0, budgetLimit - totalSpent);

  return (
    <div className="pb-24 px-4 pt-4 animate-fade-in">
      {/* Profil Salomi */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-brand-muted text-sm block">Xush kelibsiz,</span>
          <h2 className="text-xl font-bold text-brand-text">{userData?.name || 'Jasur'} 👋</h2>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-brand-primary text-slate-950 font-bold px-3 py-2 rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      {/* Moliya Kartasi */}
      <div className="glass rounded-3xl p-6 mb-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-start">
          <div>
            <span className="text-brand-muted text-xs uppercase tracking-wider block">Bu oygi jami xarajat</span>
            <span className="text-3xl font-extrabold text-brand-text">
              {totalSpent.toLocaleString('uz-UZ')} <span className="text-brand-primary text-lg">UZS</span>
            </span>
          </div>
          <button 
            onClick={() => setShowBudgetModal(true)}
            className="p-2 hover:bg-slate-700/50 rounded-full transition-colors text-brand-muted hover:text-brand-text"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {budgetLimit > 0 ? (
          <div>
            <div className="flex justify-between text-xs text-brand-muted mb-1">
              <span>Limit: {budgetLimit.toLocaleString('uz-UZ')} UZS</span>
              <span className={percentSpent > 100 ? 'text-brand-danger font-bold' : 'text-brand-success'}>
                {percentSpent.toFixed(1)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${percentSpent > 100 ? 'bg-brand-danger' : percentSpent > 80 ? 'bg-brand-warning' : 'bg-brand-success'}`}
                style={{ width: `${Math.min(100, percentSpent)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-brand-muted mt-2">
              <span>{percentSpent > 100 ? 'Budjet oshib ketdi!' : 'Qoldiq:'}</span>
              <span className="font-bold text-brand-text">
                {percentSpent > 100 
                  ? `-${(totalSpent - budgetLimit).toLocaleString('uz-UZ')} UZS`
                  : `${remainingBudget.toLocaleString('uz-UZ')} UZS`
                }
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3 flex justify-between items-center text-xs">
            <span className="text-brand-muted">Budjet limiti belgilanmagan.</span>
            <button 
              onClick={() => setShowBudgetModal(true)}
              className="text-brand-primary font-bold hover:underline"
            >
              Belgilash
            </button>
          </div>
        )}
      </div>

      {/* Chart Bo'limi */}
      {monthlyTxs.length > 0 && (
        <div className="glass rounded-3xl p-5 mb-6">
          <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider mb-4">Toifalar bo'yicha tahlil</h3>
          <div className="flex items-center gap-4 justify-between">
            {/* Recharts Pie Chart */}
            <div className="w-[140px] h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString('uz-UZ')} UZS`]}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Ranglar/Legend */}
            <div className="flex-1 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {chartData.map((d, i) => {
                const percent = ((d.value / totalSpent) * 100).toFixed(0);
                return (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-brand-muted truncate">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: d.color }}></span>
                      <span className="truncate">{d.name}</span>
                    </div>
                    <span className="font-bold text-brand-text text-right">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* So'nggi Tranzaksiyalar */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider">So'nggi xarajatlar</h3>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-brand-primary flex items-center gap-0.5 hover:underline"
          >
            Barchasi <ArrowRight size={12} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-brand-muted text-sm border border-dashed border-slate-700/50">
            📭 Hali xarajatlar mavjud emas.<br/>
            SMS-larni botga yuboring yoki qo'lda qo'shing.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.slice(0, 4).map((t) => (
              <div key={t.id} className="glass rounded-2xl p-4 flex justify-between items-center hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shadow-inner">
                    {t.category.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-text truncate max-w-[150px]">{t.merchant}</h4>
                    <span className="text-[10px] text-brand-muted block">
                      {new Date(t.date).toLocaleDateString('uz-UZ')} • {t.category.substring(3)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-brand-text">
                    -{Number(t.amount).toLocaleString('uz-UZ')} UZS
                  </span>
                  <button 
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-brand-muted hover:text-brand-danger rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Tranzaksiya Qo'shish */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-brand-card rounded-t-3xl p-6 animate-fade-in border border-slate-700/50 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-brand-text">Yangi Xarajat</h3>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-brand-muted block mb-1">Mablag' (UZS)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masalan: 25000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs text-brand-muted block mb-1">Joy / Do'kon (Merchant)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Masalan: Korzinka, Bolt"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs text-brand-muted block mb-1">Toifa</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-800 text-brand-text py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-primary text-slate-950 font-bold py-3 rounded-xl hover:bg-sky-400 transition-colors"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Budjet Yangilash */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-brand-card rounded-t-3xl p-6 animate-fade-in border border-slate-700/50 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-brand-text">Oylik umumiy budjet</h3>
            <form onSubmit={handleUpdateBudget} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-brand-muted block mb-1">Budjet Limit (UZS)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masalan: 5000000"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 bg-slate-800 text-brand-text py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-primary text-slate-950 font-bold py-3 rounded-xl hover:bg-sky-400 transition-colors"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
