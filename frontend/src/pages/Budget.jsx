import React, { useState, useEffect } from 'react';
import { Edit2, Check, AlertCircle, Target } from 'lucide-react';

const CATEGORIES = [
  { name: '🛒 Oziq-ovqat', color: '#10b981' },
  { name: '🚗 Transport',  color: '#3b9ef8' },
  { name: '🍕 Restoran',   color: '#f59e0b' },
  { name: '💊 Sog\'liq',  color: '#f43f5e' },
  { name: '🏠 Maishiy',   color: '#a78bfa' },
  { name: '💡 Kommunal',  color: '#fbbf24' },
  { name: '🎯 Boshqa',    color: '#64748b' },
];

export default function Budget({ fetchWithAuth }) {
  const [budgets, setBudgets]           = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [limitInput, setLimitInput]     = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, txsData] = await Promise.all([
        fetchWithAuth('/api/budgets'),
        fetchWithAuth('/api/transactions'),
      ]);
      setBudgets(budgetsData);
      setTransactions(txsData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSaveLimit = async (categoryName) => {
    const limitAmount = parseFloat(limitInput);
    if (isNaN(limitAmount) || limitAmount < 0) return;
    try {
      await fetchWithAuth('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ category: categoryName, limit_amount: limitAmount }),
      });
      setEditingCategory(null);
      setLimitInput('');
      loadData();
    } catch (err) { console.error(err); }
  };

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyTxs = transactions.filter(t => t.date.substring(0, 7) === currentMonthStr);

  const categorySpentMap = {};
  monthlyTxs.forEach(t => {
    categorySpentMap[t.category] = (categorySpentMap[t.category] || 0) + Number(t.amount);
  });

  return (
    <div className="pb-28 px-4 pt-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0d1b4b, #1e63f5)' }}>
          <Target size={16} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Budjet Limitlari
        </h2>
      </div>
      <p className="text-xs mb-5 ml-10" style={{ color: 'var(--color-muted)' }}>
        Toifalar bo'yicha oylik limitlarni belgilang
      </p>

      {loading ? (
        <div className="text-center py-16 text-sm animate-pulse" style={{ color: 'var(--color-muted)' }}>
          Yuklanmoqda...
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {CATEGORIES.map(({ name: cat, color }) => {
            const spent     = categorySpentMap[cat] || 0;
            const budgetObj = budgets.find(b => b.category === cat);
            const limit     = budgetObj ? Number(budgetObj.limit_amount) : 0;
            const percent   = limit > 0 ? (spent / limit) * 100 : 0;
            const isEditing = editingCategory === cat;

            // Progress color
            const barColor  = percent > 100 ? '#f43f5e' : percent > 85 ? '#f59e0b' : color;

            return (
              <div
                key={cat}
                className="glass rounded-3xl p-5 flex flex-col gap-3 transition-all duration-300"
                style={{ borderColor: isEditing ? 'rgba(30,99,245,0.30)' : 'rgba(59,158,248,0.10)' }}
              >
                {/* Row: name + edit/save button */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <span className="text-sm font-extrabold" style={{ color: 'var(--color-text)' }}>{cat}</span>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => { setEditingCategory(cat); setLimitInput(limit || ''); }}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      style={{
                        color: 'var(--color-primary)',
                        background: 'rgba(30,99,245,0.08)',
                        border: '1px solid rgba(59,158,248,0.20)',
                      }}
                    >
                      <Edit2 size={11} /> Tahrirlash
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveLimit(cat)}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      style={{
                        color: '#10b981',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.20)',
                      }}
                    >
                      <Check size={12} /> Saqlash
                    </button>
                  )}
                </div>

                {/* Editing input */}
                {isEditing && (
                  <div className="flex gap-2 animate-fade-in">
                    <input
                      type="number"
                      placeholder="Limit miqdori (UZS)"
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      className="flex-1 glass-input px-3 py-2.5 text-xs"
                      style={{ color: 'var(--color-text)' }}
                    />
                    <button
                      onClick={() => handleSaveLimit(cat)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white btn-primary"
                    >
                      Tayyor
                    </button>
                  </div>
                )}

                {/* Stats & Progress */}
                {!isEditing && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[11px] font-medium"
                      style={{ color: 'var(--color-muted)' }}>
                      <span>
                        Sarflangan: <strong style={{ color: 'var(--color-text)' }}>
                          {spent.toLocaleString('uz-UZ')} UZS
                        </strong>
                      </span>
                      {limit > 0 ? (
                        <span>
                          Limit: <strong style={{ color: 'var(--color-text)' }}>
                            {limit.toLocaleString('uz-UZ')} UZS
                          </strong>
                        </span>
                      ) : (
                        <span className="italic text-[10px]">Limit yo'q</span>
                      )}
                    </div>

                    {limit > 0 && (
                      <>
                        {/* Progress bar */}
                        <div className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(59,158,248,0.08)', border: '1px solid rgba(59,158,248,0.10)' }}>
                          <div
                            className="h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.min(100, percent)}%`,
                              background: barColor,
                              animation: percent > 100 ? 'glowPulse 1.5s ease-in-out infinite' : 'none',
                            }}
                          >
                            <div className="absolute inset-0 progress-shimmer" />
                          </div>
                        </div>

                        {/* Percent info */}
                        <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          <span>{percent.toFixed(0)}% ishlatildi</span>
                          {percent > 100 ? (
                            <span className="font-extrabold flex items-center gap-0.5 animate-pulse"
                              style={{ color: 'var(--color-danger)' }}>
                              <AlertCircle size={10} />
                              Limit buzildi! (-{(spent - limit).toLocaleString('uz-UZ')} UZS)
                            </span>
                          ) : (
                            <span className="font-semibold" style={{ color: barColor }}>
                              Qoldiq: {(limit - spent).toLocaleString('uz-UZ')} UZS
                            </span>
                          )}
                        </div>
                      </>
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
