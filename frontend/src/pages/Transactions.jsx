import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Calendar, DollarSign } from 'lucide-react';

const CATEGORIES = [
  'Barchasi',
  '🛒 Oziq-ovqat',
  '🚗 Transport',
  '🍕 Restoran',
  '💊 Sog\'liq',
  '🏠 Maishiy',
  '💡 Kommunal',
  '🎯 Boshqa'
];

export default function Transactions({ fetchWithAuth }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/api/transactions');
      setTransactions(data);
    } catch (err) {
      console.error('Tranzaksiyalarni olishda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Ushbu tranzaksiyani o\'chirmoqchimisiz?')) return;
    try {
      await fetchWithAuth(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      loadTransactions();
    } catch (err) {
      console.error('O\'chirishda xatolik:', err);
    }
  };

  // Saralash va filtrlash
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.sms_raw && t.sms_raw.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Barchasi' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalFilteredAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="pb-24 px-4 pt-5 animate-fade-in">
      <h2 className="text-xl font-extrabold text-brand-text mb-4 tracking-tight">Tranzaksiyalar Tarixi</h2>

      {/* Qidiruv va Filtr paneli */}
      <div className="flex flex-col gap-4.5 mb-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Do'kon yoki SMS matnidan qidirish..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-2xl pl-11 pr-4 py-3.5 text-xs text-brand-text focus:outline-none"
          />
          <Search size={16} className="absolute left-4 top-4 text-brand-muted" />
        </div>

        {/* Toifalar gorizontal slayderi */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.25)] scale-102' 
                  : 'bg-slate-950/40 hover:bg-slate-900/60 text-brand-muted border border-slate-900/80 hover:text-brand-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hisoblagich qismi */}
      <div className="glass rounded-2xl p-4 mb-4 flex justify-between items-center text-xs font-semibold">
        <span className="text-brand-muted">Saralangan tranzaksiyalar: <strong className="text-brand-text">{filteredTransactions.length} ta</strong></span>
        <span className="text-brand-muted">Jami: <strong className="text-brand-primary text-sm font-bold">{totalFilteredAmount.toLocaleString('uz-UZ')} UZS</strong></span>
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm animate-pulse">Yuklanmoqda...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-brand-muted text-sm border border-dashed border-slate-800/80">
          🔍 Qidiruv bo'yicha hech narsa topilmadi.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="glass hover:bg-slate-900/40 border border-slate-950 hover:border-slate-800/30 rounded-2xl p-4 flex justify-between items-center transition-all duration-300 transform hover:-translate-y-0.5 shadow-md">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/40 flex items-center justify-center text-lg shadow-inner shrink-0 mt-0.5">
                  {t.category.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-brand-text truncate pr-2">{t.merchant}</h4>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className="text-[10px] text-brand-muted">
                      {new Date(t.date).toLocaleDateString('uz-UZ')} • {t.category.substring(3)}
                    </span>
                    {t.sms_raw && (
                      <span className="text-[9px] text-brand-primary/95 bg-brand-primary/5 border border-brand-primary/10 px-2.5 py-1.5 rounded-xl italic mt-1.5 inline-block leading-relaxed max-w-[200px] break-words" title={t.sms_raw}>
                        💬 {t.sms_raw}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="font-bold text-sm text-brand-text">
                  -{Number(t.amount).toLocaleString('uz-UZ')} UZS
                </span>
                <button 
                  onClick={() => handleDelete(t.id)}
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
  );
}
