import React, { useState, useEffect } from 'react';
import { Target, Save, Edit2, Check } from 'lucide-react';

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
    <div className="pb-24 px-4 pt-4 animate-fade-in">
      <h2 className="text-xl font-bold text-brand-text mb-2">Budjet Chegaralari</h2>
      <p className="text-xs text-brand-muted mb-6">Xarajatlar oylik limitlardan oshib ketganda bot sizni ogohlantiradi.</p>

      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm">Yuklanmoqda...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {CATEGORIES.map(cat => {
            const spent = categorySpentMap[cat] || 0;
            const budgetObj = budgets.find(b => b.category === cat);
            const limit = budgetObj ? Number(budgetObj.limit_amount) : 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const isEditing = editingCategory === cat;

            return (
              <div key={cat} className="glass rounded-3xl p-5 border border-slate-700/50 flex flex-col gap-3 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-brand-text">{cat}</span>
                  </div>

                  {!isEditing ? (
                    <button 
                      onClick={() => {
                        setEditingCategory(cat);
                        setLimitInput(limit || '');
                      }}
                      className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline"
                    >
                      <Edit2 size={12} /> Tahrirlash
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSaveLimit(cat)}
                      className="text-xs font-bold text-brand-success flex items-center gap-1 hover:underline"
                    >
                      <Check size={14} /> Saqlash
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2 items-center animate-fade-in mt-1">
                    <input 
                      type="number"
                      placeholder="Limit summasini kiriting (UZS)"
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary"
                    />
                    <button 
                      onClick={() => handleSaveLimit(cat)}
                      className="bg-brand-primary text-slate-950 font-bold px-3 py-2 rounded-xl text-sm"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex justify-between text-xs text-brand-muted">
                      <span>Sarflangan: <strong>{spent.toLocaleString('uz-UZ')} UZS</strong></span>
                      {limit > 0 ? (
                        <span>Limit: <strong>{limit.toLocaleString('uz-UZ')} UZS</strong></span>
                      ) : (
                        <span className="italic text-slate-500">Limit belgilanmagan</span>
                      )}
                    </div>

                    {limit > 0 && (
                      <div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${percent > 100 ? 'bg-brand-danger' : percent > 85 ? 'bg-brand-warning' : 'bg-brand-success'}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-brand-muted mt-1">
                          <span>Ishlatilishi: {percent.toFixed(0)}%</span>
                          {percent > 100 ? (
                            <span className="text-brand-danger font-bold">Limit oshib ketdi!</span>
                          ) : (
                            <span>Qoldiq: {(limit - spent).toLocaleString('uz-UZ')} UZS</span>
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
