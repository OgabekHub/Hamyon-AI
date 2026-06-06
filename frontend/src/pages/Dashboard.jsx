import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { 
  Plus, Edit2, Trash2, ArrowRight, X, TrendingDown, Wallet2,
  ShoppingCart, Car, Utensils, HeartPulse, Home, Lightbulb, HelpCircle 
} from 'lucide-react';
import BottomSheet from '../components/BottomSheet';

const CATEGORIES = [
  { name: '🛒 Oziq-ovqat', color: '#10b981' },
  { name: '🚗 Transport',  color: '#3b9ef8' },
  { name: '🍕 Restoran',   color: '#f59e0b' },
  { name: '💊 Sog\'liq',  color: '#f43f5e' },
  { name: '🏠 Maishiy',   color: '#a78bfa' },
  { name: '💡 Kommunal',  color: '#fbbf24' },
  { name: '🎯 Boshqa',    color: '#64748b' },
];

const CATEGORY_MAP = {
  '🛒 Oziq-ovqat': { displayName: 'Oziq-ovqat', color: '#10b981', Icon: ShoppingCart },
  '🚗 Transport':  { displayName: 'Transport',  color: '#3b9ef8', Icon: Car },
  '🍕 Restoran':   { displayName: 'Restoran',   color: '#f59e0b', Icon: Utensils },
  '💊 Sog\'liq':   { displayName: 'Sog\'liq',    color: '#f43f5e', Icon: HeartPulse },
  '🏠 Maishiy':    { displayName: 'Maishiy',    color: '#a78bfa', Icon: Home },
  '💡 Kommunal':   { displayName: 'Kommunal',   color: '#fbbf24', Icon: Lightbulb },
  '🎯 Boshqa':     { displayName: 'Boshqa',     color: '#64748b', Icon: HelpCircle },
};

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function Dashboard({ fetchWithAuth, user, setActiveTab, transactions, userData, refreshTransactions, refreshProfile, triggerHaptic }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedChartCategory, setSelectedChartCategory] = useState(null);

  const [amount,    setAmount]    = useState('');
  const [merchant,  setMerchant]  = useState('');
  const [category,  setCategory]  = useState(CATEGORIES[0].name);
  const [newBudget, setNewBudget] = useState('');

  const handleOpenBudgetModal = () => {
    setNewBudget(userData?.monthly_budget || '');
    setShowBudgetModal(true);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      triggerHaptic?.('notification', 'error');
      return;
    }
    try {
      await fetchWithAuth('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amount), merchant, category, date: new Date().toISOString() }),
      });
      setShowAddModal(false);
      setAmount(''); setMerchant(''); setCategory(CATEGORIES[0].name);
      refreshTransactions();
      triggerHaptic?.('notification', 'success');
    } catch { 
      triggerHaptic?.('notification', 'error');
      alert("Qo'shib bo'lmadi"); 
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/api/user/budget', {
        method: 'POST',
        body: JSON.stringify({ monthly_budget: parseFloat(newBudget) || 0 }),
      });
      setShowBudgetModal(false);
      refreshProfile();
      triggerHaptic?.('notification', 'success');
    } catch (err) { 
      triggerHaptic?.('notification', 'error');
      console.error(err); 
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await fetchWithAuth(`/api/transactions/${id}`, { method: 'DELETE' });
      refreshTransactions();
      triggerHaptic?.('impact', 'medium');
    } catch (err) { 
      triggerHaptic?.('notification', 'error');
      console.error(err); 
    }
  };

  // Calculations
  const txs             = Array.isArray(transactions) ? transactions : [];
  const displayedTxs    = selectedChartCategory
    ? txs.filter(t => t.category === selectedChartCategory)
    : txs;
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyTxs      = txs.filter(t => t.date.substring(0, 7) === currentMonthStr);
  const totalSpent      = monthlyTxs.reduce((s, t) => s + Number(t.amount), 0);
  const budgetLimit     = Number(userData?.monthly_budget || 0);
  const percentSpent    = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const remaining       = Math.max(0, budgetLimit - totalSpent);

  const categoryTotals = {};
  monthlyTxs.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });
  const chartData = Object.entries(categoryTotals).map(([name, value]) => {
    const cat = CATEGORIES.find(c => c.name === name) || { color: '#64748b' };
    return { name, value, color: cat.color };
  });

  const progressColor = percentSpent > 100 ? '#f43f5e' : percentSpent > 80 ? '#f59e0b' : '#10b981';

  return (
    <div className="pb-28 px-4 pt-5 animate-fade-in">

      {/* ── Top row: greeting + add button ── */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest block mb-0.5"
            style={{ color: 'var(--color-muted)' }}>
            Xush kelibsiz,
          </span>
          <h2 className="text-xl font-extrabold tracking-tight"
            style={{ color: 'var(--color-text)' }}>
            {userData?.name || 'Foydalanuvchi'} 👋
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white btn-primary"
        >
          <Plus size={15} strokeWidth={2.5} /> Qo'shish
        </button>
      </div>

      {/* ── HERO CARD: gradient navy→blue ── */}
      <div className="hero-card rounded-3xl p-6 mb-5 shadow-[0_12px_40px_rgba(13,27,75,0.50)]">
        <div className="flex justify-between items-start mb-1 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet2 size={12} className="text-blue-200/70" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/70 block">
                Bu oygi jami xarajat
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {totalSpent.toLocaleString('uz-UZ')}
              </span>
              <span className="text-sm font-bold text-blue-200 mb-0.5">UZS</span>
            </div>
          </div>
          <button
            onClick={handleOpenBudgetModal}
            className="p-2 rounded-xl transition-all duration-200 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}
            title="Budjetni tahrirlash"
          >
            <Edit2 size={14} className="text-white" />
          </button>
        </div>

        {/* Progress / Budget */}
        {budgetLimit > 0 ? (
          <div className="relative z-10 mt-4">
            <div className="flex justify-between text-[11px] font-medium mb-2 text-blue-100/70">
              <span>Limit: {budgetLimit.toLocaleString('uz-UZ')} UZS</span>
              <span style={{ color: progressColor === '#10b981' ? '#6ee7b7' : progressColor === '#f59e0b' ? '#fcd34d' : '#fca5a5' }}>
                {percentSpent.toFixed(1)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div
                className="h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, percentSpent)}%`, background: progressColor }}
              >
                <div className="absolute inset-0 progress-shimmer" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-blue-200/60 mt-1.5">
              <span>{percentSpent > 100 ? 'Budjet oshib ketdi!' : 'Qoldiq:'}</span>
              <span className="font-bold text-white">
                {percentSpent > 100
                  ? `-${(totalSpent - budgetLimit).toLocaleString('uz-UZ')} UZS`
                  : `${remaining.toLocaleString('uz-UZ')} UZS`}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mt-4 rounded-2xl px-4 py-3 flex justify-between items-center text-xs"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="text-blue-100/70">Oylik budjet belgilanmagan</span>
            <button
              onClick={handleOpenBudgetModal}
              className="font-bold text-white underline"
            >
              Belgilash
            </button>
          </div>
        )}
      </div>

      {/* ── Pie Chart ── */}
      {chartData.length > 0 && (
        <div className="glass rounded-3xl p-5 mb-5 animate-scale-in">
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-muted)' }}>
            Toifalar bo'yicha tahlil {selectedChartCategory && '· Saralangan'}
          </h3>
          <div className="flex items-center gap-4">
            {/* Donut chart */}
            <div className="relative w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%" cy="50%"
                    innerRadius={38} outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, i) => {
                      const isSelected = selectedChartCategory === entry.name;
                      const hasSelection = selectedChartCategory !== null;
                      return (
                        <Cell 
                          key={i} 
                          fill={isSelected || !hasSelection ? entry.color : `${entry.color}33`} 
                          style={{
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.25s ease',
                          }}
                          onClick={() => {
                            setSelectedChartCategory(prev => prev === entry.name ? null : entry.name);
                            triggerHaptic?.('selection');
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={v => [`${v.toLocaleString('uz-UZ')} UZS`]}
                    contentStyle={{
                      background: 'rgba(7,12,26,0.95)',
                      border: '1px solid rgba(59,158,248,0.25)',
                      borderRadius: '12px',
                      color: '#e8f0ff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
                style={{ 
                  pointerEvents: selectedChartCategory ? 'auto' : 'none',
                  background: selectedChartCategory ? 'rgba(59,158,248,0.06)' : 'transparent',
                  borderRadius: '99px',
                  margin: '38px',
                }}
                onClick={() => {
                  setSelectedChartCategory(null);
                  triggerHaptic?.('impact', 'light');
                }}
              >
                <span className="text-[9px] uppercase tracking-wider text-center block" style={{ color: selectedChartCategory ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                  {selectedChartCategory ? 'Tozalash' : 'Jami'}
                </span>
                <span className="text-xs font-black block" style={{ color: 'var(--color-text)' }}>
                  {selectedChartCategory ? fmt(categoryTotals[selectedChartCategory] || 0) : fmt(totalSpent)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 flex flex-col gap-2 max-h-[130px] overflow-y-auto pr-1 scrollbar-none">
              {chartData.map((d, i) => {
                const catInfo = CATEGORY_MAP[d.name] || { displayName: d.name, color: d.color || '#64748b', Icon: HelpCircle };
                const IconComponent = catInfo.Icon;
                const catColor = catInfo.color;
                const isSelected = selectedChartCategory === d.name;
                const hasSelection = selectedChartCategory !== null;

                return (
                  <div 
                    key={i} 
                    className="flex justify-between items-center text-[11px] cursor-pointer transition-all duration-200 active:scale-98"
                    style={{
                      opacity: isSelected || !hasSelection ? 1 : 0.35,
                      transform: isSelected ? 'translateX(2px)' : 'translateX(0)',
                    }}
                    onClick={() => {
                      setSelectedChartCategory(prev => prev === d.name ? null : d.name);
                      triggerHaptic?.('selection');
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0" style={{ color: 'var(--color-muted)' }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ 
                          background: `${catColor}15`, 
                          border: `1px solid ${catColor}30`,
                          color: catColor,
                          boxShadow: `0 0 6px ${catColor}05`
                        }}>
                        <IconComponent size={12} />
                      </div>
                      <span className="truncate text-xs font-semibold" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {catInfo.displayName}
                      </span>
                    </div>
                    <span className="font-extrabold text-xs ml-2" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {((d.value / totalSpent) * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            {selectedChartCategory 
              ? `${CATEGORY_MAP[selectedChartCategory]?.displayName || selectedChartCategory} bo'yicha` 
              : "So'nggi xarajatlar"}
          </h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold flex items-center gap-0.5"
            style={{ color: 'var(--color-primary)' }}
          >
            Barchasi <ArrowRight size={11} />
          </button>
        </div>

        {displayedTxs.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-sm border-dashed"
            style={{
              color: 'var(--color-muted)',
              borderColor: 'rgba(59,158,248,0.15)',
            }}>
            <TrendingDown size={36} className="mx-auto mb-3 opacity-30" />
            Hali xarajatlar mavjud emas.<br />
            SMS-larni botga yuboring yoki qo'lda qo'shing.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayedTxs.slice(0, 5).map(t => (
              <div
                key={t.id}
                className="glass rounded-2xl px-4 py-3.5 flex justify-between items-center border border-[rgba(59,158,248,0.10)] transition-all duration-300 hover:border-[rgba(59,158,248,0.25)] hover:bg-[rgba(59,158,248,0.03)]"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const catInfo = CATEGORY_MAP[t.category] || { displayName: t.category, color: '#64748b', Icon: HelpCircle };
                    const IconComponent = catInfo.Icon;
                    const catColor = catInfo.color;
                    return (
                      <>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ 
                            background: `${catColor}15`, 
                            border: `1px solid ${catColor}30`,
                            color: catColor,
                            boxShadow: `0 0 10px ${catColor}08`
                          }}>
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm truncate max-w-[140px]"
                            style={{ color: 'var(--color-text)' }}>{t.merchant}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            {new Date(t.date).toLocaleDateString('uz-UZ')} · {catInfo.displayName}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-sm" style={{ color: 'var(--color-text)' }}>
                    -{Number(t.amount).toLocaleString('uz-UZ')}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="p-1.5 rounded-lg transition-all duration-200"
                    style={{
                      color: 'var(--color-muted)',
                      background: 'rgba(244,63,94,0.06)',
                      border: '1px solid rgba(244,63,94,0.12)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Yangi Xarajat"
      >
        <form onSubmit={handleAddTransaction} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Mablag' (UZS)</label>
            <input
              type="number" required placeholder="Masalan: 25000"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full glass-input px-4 py-3.5 text-sm"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Joy / Do'kon</label>
            <input
              type="text" required placeholder="Masalan: Korzinka"
              value={merchant} onChange={e => setMerchant(e.target.value)}
              className="w-full glass-input px-4 py-3.5 text-sm"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-2"
              style={{ color: 'var(--color-muted)' }}>Toifa tanlang</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => {
                const catInfo = CATEGORY_MAP[c.name] || { displayName: c.name, color: '#64748b', Icon: HelpCircle };
                const IconComponent = catInfo.Icon;
                const isSelected = category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => { setCategory(c.name); triggerHaptic?.('selection'); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${c.name === '🎯 Boshqa' ? 'col-span-2 justify-center' : ''}`}
                    style={
                      isSelected
                        ? {
                            background: `${catInfo.color}15`,
                            border: `1px solid ${catInfo.color}`,
                            color: 'var(--color-text)',
                            boxShadow: `0 0 12px ${catInfo.color}15`
                          }
                        : {
                            background: 'var(--color-glass-bg)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-muted)'
                          }
                    }
                  >
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        background: isSelected ? `${catInfo.color}25` : 'rgba(59,158,248,0.06)',
                        color: catInfo.color 
                      }}
                    >
                      <IconComponent size={12} />
                    </div>
                    <span className="truncate">{catInfo.displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                background: 'rgba(59,158,248,0.06)',
                border: '1px solid rgba(59,158,248,0.16)',
                color: 'var(--color-muted)',
              }}>
              Bekor
            </button>
            <button type="submit"
              className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider text-white btn-primary">
              Saqlash
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ── BOTTOM SHEET: Budget ── */}
      <BottomSheet
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Oylik Budjet Limiti"
      >
        <form onSubmit={handleUpdateBudget} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--color-muted)' }}>Budjet (UZS)</label>
            <input
              type="number" required placeholder="Masalan: 5000000"
              value={newBudget} onChange={e => setNewBudget(e.target.value)}
              className="w-full glass-input px-4 py-3.5 text-sm"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowBudgetModal(false)}
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(59,158,248,0.06)',
                border: '1px solid rgba(59,158,248,0.16)',
                color: 'var(--color-muted)',
              }}>
              Bekor
            </button>
            <button type="submit"
              className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider text-white btn-primary">
              Yangilash
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
