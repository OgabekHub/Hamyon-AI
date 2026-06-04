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
    <div className="pb-24 px-4 pt-4 animate-fade-in">
      <h2 className="text-xl font-bold text-brand-text mb-4">Tranzaksiyalar</h2>

      {/* Qidiruv va Filtr paneli */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Do'kon yoki SMS matnidan qidirish..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card border border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-brand-muted" />
        </div>

        {/* Toifalar gorizontal slayderi */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-brand-primary text-slate-950 font-bold' 
                  : 'bg-brand-card hover:bg-slate-800 text-brand-muted border border-slate-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hisoblagich qismi */}
      <div className="glass rounded-2xl p-4 mb-4 flex justify-between items-center text-xs">
        <span className="text-brand-muted">Saralangan tranzaksiyalar: <strong className="text-brand-text">{filteredTransactions.length} ta</strong></span>
        <span className="text-brand-muted">Jami: <strong className="text-brand-text text-sm">{totalFilteredAmount.toLocaleString('uz-UZ')} UZS</strong></span>
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm">Yuklanmoqda...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-brand-muted text-sm border border-dashed border-slate-700/50">
          🔍 Qidiruv bo'yicha hech narsa topilmadi.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="glass rounded-2xl p-4 flex justify-between items-center hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shadow-inner">
                  {t.category.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-text truncate max-w-[170px]">{t.merchant}</h4>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-brand-muted">
                      {new Date(t.date).toLocaleDateString('uz-UZ')} • {t.category.substring(3)}
                    </span>
                    {t.sms_raw && (
                      <span className="text-[8px] text-brand-muted/80 bg-slate-900 px-1 py-0.5 rounded italic truncate max-w-[170px]" title={t.sms_raw}>
                        SMS: {t.sms_raw}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-brand-text">
                  -{Number(t.amount).toLocaleString('uz-UZ')} UZS
                </span>
                <button 
                  onClick={() => handleDelete(t.id)}
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
  );
}
