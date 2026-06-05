import React, { useState, useEffect } from 'react';
import { Target, Save, Edit2, Check, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  '🛒 Oziq-ovqat',
  '🚗 Transport',
  '🍕 Restoran',
  '💊 Sog\'liq',
  '🏠 Maishiy',
  '💡 Kommunal',
  '🎯 Boshqa'
];

export default function Budget({ fetchWithAuth }) {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Qaysi kategoriya tahrirlanayotganini bilish
  const [editingCategory, setEditingCategory] = useState(null);
  const [limitInput, setLimitInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, txsData] = await Promise.all([
        fetchWithAuth('/api/budgets'),
        fetchWithAuth('/api/transactions')
      ]);
      setBudgets(budgetsData);
      setTransactions(txsData);
    } catch (err) {
      console.error('Budjet yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimit = async (categoryName) => {
    const limitAmount = parseFloat(limitInput);
    if (isNaN(limitAmount) || limitAmount < 0) return;

    try {
      await fetchWithAuth('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: categoryName,
          limit_amount: limitAmount
        })
      });
      setEditingCategory(null);
      setLimitInput('');
      loadData();
    } catch (err) {
      console.error('Budjet saqlashda xatolik:', err);
    }
  };

  // Joriy oydagi xarajatlar filteri
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyTxs = transactions.filter(t => t.date.substring(0, 7) === currentMonthStr);

  // Har bir toifa uchun sarflangan summa
  const categorySpentMap = {};
  monthlyTxs.forEach(t => {
    categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + Number(t.amount);
  });

  return (
    <div className="pb-24 px-4 pt-5 animate-fade-in">
      <h2 className="text-xl font-extrabold text-brand-text tracking-tight mb-1">Budjet Limitlari</h2>
      <p className="text-xs text-brand-muted mb-6 font-medium">Toifalar uchun oylik xarajat limitlarini belgilang. Chegaradan oshganda bot sizni darhol ogohlantiradi.</p>

      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm animate-pulse">Yuklanmoqda...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {CATEGORIES.map(cat => {
            const spent = categorySpentMap[cat] || 0;
            const budgetObj = budgets.find(b => b.category === cat);
            const limit = budgetObj ? Number(budgetObj.limit_amount) : 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const isEditing = editingCategory === cat;

            return (
              <div key={cat} className="glass rounded-3xl p-5 border border-slate-950 hover:border-slate-800/30 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-brand-text">{cat}</span>
                  </div>

                  {!isEditing ? (
                    <button 
                      onClick={() => {
                        setEditingCategory(cat);
                        setLimitInput(limit || '');
                      }}
                      className="text-xs font-bold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/10 px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1"
                    >
                      <Edit2 size={11} /> Tahrirlash
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSaveLimit(cat)}
                      className="text-xs font-bold text-brand-success bg-brand-success/5 hover:bg-brand-success/10 border border-brand-success/10 px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1"
                    >
                      <Check size={12} /> Saqlash
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2 items-center animate-fade-in mt-1">
                    <input 
                      type="number"
                      placeholder="Limit (UZS)"
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      className="flex-1 glass-input rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                    <button 
                      onClick={() => handleSaveLimit(cat)}
                      className="bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md"
                    >
                      Tayyor
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex justify-between text-xs font-medium text-brand-muted">
                      <span>Sarflangan: <strong className="text-brand-text">{spent.toLocaleString('uz-UZ')} UZS</strong></span>
                      {limit > 0 ? (
                        <span>Limit: <strong className="text-brand-text">{limit.toLocaleString('uz-UZ')} UZS</strong></span>
                      ) : (
                        <span className="italic text-slate-650 text-[10px]">Limit belgilanmagan</span>
                      )}
                    </div>

                    {limit > 0 && (
                      <div className="mt-0.5">
                        {/* Progress bar */}
                        <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden p-[2px] border border-slate-900">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                              percent > 100 
                                ? 'bg-gradient-to-r from-brand-danger to-rose-500 animate-pulse' 
                                : percent > 85 
                                  ? 'bg-gradient-to-r from-brand-warning to-yellow-450' 
                                  : 'bg-gradient-to-r from-brand-success to-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-brand-muted mt-2">
                          <span className="font-semibold">Ishlatilishi: {percent.toFixed(0)}%</span>
                          {percent > 100 ? (
                            <span className="text-brand-danger font-extrabold flex items-center gap-0.5 animate-pulse">
                              <AlertCircle size={10} /> Limit buzildi (-{(spent - limit).toLocaleString('uz-UZ')} UZS)
                            </span>
                          ) : (
                            <span className="font-semibold">Qoldiq: {(limit - spent).toLocaleString('uz-UZ')} UZS</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
