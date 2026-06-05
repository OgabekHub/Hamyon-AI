import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Plus, Edit2, Trash2, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { name: '🛒 Oziq-ovqat', color: '#05ffb0' }, // success (neon emerald)
  { name: '🚗 Transport', color: '#00e5ff' }, // primary (neon cyan)
  { name: '🍕 Restoran', color: '#ffaa00' },   // warning (neon gold)
  { name: '💊 Sog\'liq', color: '#ff007f' },   // rose (electric rose)
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
    <div className="pb-24 px-4 pt-5 animate-fade-in">
      {/* Profil Salomi */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-brand-muted text-xs font-medium uppercase tracking-wider block">Xush kelibsiz,</span>
          <h2 className="text-xl font-extrabold text-brand-text tracking-tight">{userData?.name || 'Jasur'} 👋</h2>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
        >
          <Plus size={16} strokeWidth={2.5} /> Qo'shish
        </button>
      </div>

      {/* Moliya Kartasi (Neon glass) */}
      <div className="glass glass-glow-primary rounded-3xl p-6 mb-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start z-10">
          <div>
            <span className="text-brand-muted text-[10px] font-bold uppercase tracking-widest block mb-1">Bu oygi jami xarajat</span>
            <span className="text-3xl font-black text-brand-text tracking-tight">
              {totalSpent.toLocaleString('uz-UZ')} <span className="text-brand-primary text-base font-bold">UZS</span>
            </span>
          </div>
          <button 
            onClick={() => setShowBudgetModal(true)}
            className="p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/40 rounded-xl transition-all duration-200 text-brand-primary"
            title="Budjetni tahrirlash"
          >
            <Edit2 size={15} />
          </button>
        </div>

        {budgetLimit > 0 ? (
          <div className="z-10 mt-1">
            <div className="flex justify-between text-xs font-medium text-brand-muted mb-1.5">
              <span>Oylik limit: {budgetLimit.toLocaleString('uz-UZ')} UZS</span>
              <span className={percentSpent > 100 ? 'text-brand-danger font-bold' : percentSpent > 80 ? 'text-brand-warning font-bold' : 'text-brand-success font-bold'}>
                {percentSpent.toFixed(1)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-3 overflow-hidden p-[2px] border border-slate-900">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  percentSpent > 100 
                    ? 'bg-gradient-to-r from-brand-danger to-rose-400' 
                    : percentSpent > 80 
                      ? 'bg-gradient-to-r from-brand-warning to-yellow-300' 
                      : 'bg-gradient-to-r from-brand-success to-emerald-300'
                }`}
                style={{ width: `${Math.min(100, percentSpent)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-brand-muted mt-2.5">
              <span>{percentSpent > 100 ? 'Budjet oshib ketdi!' : 'Qoldiq budjet:'}</span>
              <span className={`font-bold ${percentSpent > 100 ? 'text-brand-danger' : 'text-brand-text'}`}>
                {percentSpent > 100 
                  ? `-${(totalSpent - budgetLimit).toLocaleString('uz-UZ')} UZS`
                  : `${remainingBudget.toLocaleString('uz-UZ')} UZS`
                }
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-4 flex justify-between items-center text-xs z-10">
            <span className="text-brand-muted">Oylik budjet limiti belgilanmagan.</span>
            <button 
              onClick={() => setShowBudgetModal(true)}
              className="text-brand-primary font-bold hover:underline transition-all"
            >
              Limit belgilash
            </button>
          </div>
        )}
      </div>

      {/* Chart Bo'limi */}
      {monthlyTxs.length > 0 && (
        <div className="glass rounded-3xl p-5 mb-6">
          <h3 className="font-bold text-[10px] text-brand-muted uppercase tracking-widest mb-4">Toifalar bo'yicha tahlil</h3>
          <div className="flex items-center gap-4 justify-between">
            {/* Recharts Pie Chart in a relative container for center labels */}
            <div className="relative w-[130px] h-[130px] flex items-center justify-center shrink-0">
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
                    contentStyle={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[9px] uppercase text-brand-muted tracking-wider">Jami</span>
                <span className="text-xs font-black text-brand-text truncate max-w-[85px]">
                  {totalSpent >= 1000000 
                    ? `${(totalSpent / 1000000).toFixed(1)}M` 
                    : totalSpent >= 1000 
                      ? `${(totalSpent / 1000).toFixed(0)}K` 
                      : totalSpent}
                </span>
              </div>
            </div>

            {/* Ranglar/Legend */}
            <div className="flex-1 flex flex-col gap-2 max-h-[130px] overflow-y-auto pr-1">
              {chartData.map((d, i) => {
                const percent = ((d.value / totalSpent) * 100).toFixed(0);
                return (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-brand-muted truncate">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.color, color: d.color }}></span>
                      <span className="truncate text-[11px] font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-brand-text text-right text-[11px]">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* So'nggi Tranzaksiyalar */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[10px] text-brand-muted uppercase tracking-widest">So'nggi xarajatlar</h3>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-brand-primary flex items-center gap-0.5 hover:underline"
          >
            Barchasi <ArrowRight size={12} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-brand-muted text-sm border border-dashed border-slate-800/80">
            📭 Hali xarajatlar mavjud emas.<br/>
            SMS-larni botga yuboring yoki qo'lda qo'shing.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.slice(0, 4).map((t) => (
              <div key={t.id} className="glass hover:bg-slate-900/40 border border-slate-950 hover:border-slate-800/30 rounded-2xl p-4 flex justify-between items-center transition-all duration-300 transform hover:-translate-y-0.5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/40 flex items-center justify-center text-lg shadow-inner">
                    {t.category.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-text truncate max-w-[150px]">{t.merchant}</h4>
                    <span className="text-[10px] text-brand-muted block mt-0.5">
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
                    className="p-2 bg-slate-950/80 hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger border border-slate-850 rounded-xl transition-all duration-200"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Tranzaksiya Qo'shish */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-slate-950/90 border border-slate-800/80 rounded-t-3xl rounded-b-xl p-6 animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-brand-text">Yangi Xarajat Qayd Etish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-muted hover:text-brand-text text-sm font-medium">Yopish</button>
            </div>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Mablag' (UZS)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masalan: 25000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Joy / Do'kon (Merchant)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Masalan: Korzinka, Yandex Go"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Toifa</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238f9cae' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.name} value={c.name} className="bg-slate-950 text-brand-text">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-brand-muted py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-colors text-xs uppercase tracking-wider"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 font-extrabold py-3.5 rounded-2xl shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-slate-950/90 border border-slate-800/80 rounded-t-3xl rounded-b-xl p-6 animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-brand-text">Oylik Umumiy Budjet Limitini O'rnatish</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-brand-muted hover:text-brand-text text-sm font-medium">Yopish</button>
            </div>
            <form onSubmit={handleUpdateBudget} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Budjet Limit (UZS)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masalan: 5000000"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-brand-muted py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-colors text-xs uppercase tracking-wider"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 font-extrabold py-3.5 rounded-2xl shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
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
