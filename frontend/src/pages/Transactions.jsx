import React, { useState, useEffect } from 'react';
import { 
  Search, Trash2, TrendingDown,
  ShoppingCart, Car, Utensils, HeartPulse, Home, Lightbulb, HelpCircle 
} from 'lucide-react';

const CATEGORIES = [
  'Barchasi',
  '🛒 Oziq-ovqat',
  '🚗 Transport',
  '🍕 Restoran',
  '💊 Sog\'liq',
  '🏠 Maishiy',
  '💡 Kommunal',
  '🎯 Boshqa',
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

export default function Transactions({ fetchWithAuth, transactions, refreshTransactions }) {
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  const handleDelete = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await fetchWithAuth(`/api/transactions/${id}`, { method: 'DELETE' });
      refreshTransactions();
    } catch (err) { console.error(err); }
  };

  const txs = Array.isArray(transactions) ? transactions : [];
  const filtered = txs.filter(t => {
    const matchSearch = t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.sms_raw && t.sms_raw.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'Barchasi' || t.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="pb-28 px-4 pt-5 animate-fade-in">

      {/* Header */}
      <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>
        Xarajatlar Tarixi
      </h2>
      <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
        Barcha kiritilgan tranzaksiyalar
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Do'kon yoki SMS matnidan qidiring..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full glass-input pl-10 pr-4 py-3 text-xs"
          style={{ color: 'var(--color-text)' }}
        />
        <Search size={15} className="absolute left-3.5 top-3.5" style={{ color: 'var(--color-muted)' }} />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-4 py-2 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95"
            style={
              selectedCategory === cat
                ? {
                    background: 'linear-gradient(135deg, #1e63f5 0%, #3b9ef8 100%)',
                    color: '#ffffff',
                    boxShadow: '0 0 14px rgba(30,99,245,0.35)',
                  }
                : {
                    background: 'var(--color-glass-bg)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-muted)',
                  }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="glass rounded-2xl px-4 py-3 mb-4 flex justify-between items-center text-xs font-semibold">
        <span style={{ color: 'var(--color-muted)' }}>
          Jami: <strong style={{ color: 'var(--color-text)' }}>{filtered.length} ta</strong>
        </span>
        <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
          {total.toLocaleString('uz-UZ')} UZS
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-sm"
          style={{ color: 'var(--color-muted)', border: '1px dashed rgba(59,158,248,0.15)' }}>
          <TrendingDown size={36} className="mx-auto mb-3 opacity-25" />
          Hech narsa topilmadi.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(t => {
            const catInfo = CATEGORY_MAP[t.category] || { displayName: t.category, color: '#64748b', Icon: HelpCircle };
            const IconComponent = catInfo.Icon;
            const catColor = catInfo.color;
            return (
              <div
                key={t.id}
                className="glass rounded-2xl px-4 py-3.5 flex justify-between items-start transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(59,158,248,0.10)' }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Category icon badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ 
                      background: `${catColor}15`, 
                      border: `1px solid ${catColor}30`,
                      color: catColor,
                      boxShadow: `0 0 10px ${catColor}08`
                    }}
                  >
                    <IconComponent size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                      {t.merchant}
                    </h4>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      {new Date(t.date).toLocaleDateString('uz-UZ')} · {catInfo.displayName}
                    </p>
                  {t.sms_raw && (
                    <span
                      className="text-[9px] mt-1.5 inline-block px-2.5 py-1 rounded-lg italic leading-relaxed max-w-[200px] break-words"
                      style={{
                        color: 'var(--color-primary)',
                        background: 'rgba(30,99,245,0.08)',
                        border: '1px solid rgba(59,158,248,0.15)',
                      }}
                      title={t.sms_raw}
                    >
                      💬 {t.sms_raw.substring(0, 60)}{t.sms_raw.length > 60 ? '...' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-extrabold text-sm" style={{ color: 'var(--color-text)' }}>
                  -{Number(t.amount).toLocaleString('uz-UZ')}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{
                    background: 'rgba(244,63,94,0.07)',
                    border: '1px solid rgba(244,63,94,0.12)',
                    color: 'var(--color-muted)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
