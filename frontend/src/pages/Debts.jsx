import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, User, Undo2 } from 'lucide-react';

export default function Debts({ fetchWithAuth }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('owed'); // 'owed' (menga qarz), 'owing' (men qarzman)
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('owed');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/api/debts');
      setDebts(data);
    } catch (err) {
      console.error('Qarzlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!personName || !amount || Number(amount) <= 0) return;

    try {
      await fetchWithAuth('/api/debts', {
        method: 'POST',
        body: JSON.stringify({
          person_name: personName,
          amount: parseFloat(amount),
          type,
          due_date: dueDate || null
        })
      });
      setShowAddModal(false);
      setPersonName('');
      setAmount('');
      setType('owed');
      setDueDate('');
      loadDebts();
    } catch (err) {
      console.error('Qarz qo\'shishda xatolik:', err);
    }
  };

  const handleTogglePaid = async (id, currentPaidStatus) => {
    try {
      await fetchWithAuth(`/api/debts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_paid: !currentPaidStatus })
      });
      loadDebts();
    } catch (err) {
      console.error('Holatni o\'zgartirishda xatolik:', err);
    }
  };

  const handleDeleteDebt = async (id) => {
    if (!confirm('Ushbu qarz yozuvini butunlay o\'chirmoqchimisiz?')) return;
    try {
      await fetchWithAuth(`/api/debts/${id}`, {
        method: 'DELETE'
      });
      loadDebts();
    } catch (err) {
      console.error('O\'chirishda xatolik:', err);
    }
  };

  const unpaidDebts = debts.filter(d => !d.is_paid);
  const paidDebts = debts.filter(d => d.is_paid);

  // Tab bo'yicha saralash
  const currentUnpaid = unpaidDebts.filter(d => d.type === activeTab);
  const currentPaid = paidDebts.filter(d => d.type === activeTab);

  // Umumiy sarhisob
  const totalOwed = unpaidDebts.filter(d => d.type === 'owed').reduce((sum, d) => sum + Number(d.amount), 0);
  const totalOwing = unpaidDebts.filter(d => d.type === 'owing').reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="pb-24 px-4 pt-5 animate-fade-in">
      {/* Sarlavha va Qo'shish */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-brand-text tracking-tight">Qarz Daftari</h2>
          <span className="text-xs text-brand-muted font-medium">Barcha olingan va berilgan qarzlarni nazorat qiling.</span>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
        >
          <Plus size={16} strokeWidth={2.5} /> Yangi qarz
        </button>
      </div>

      {/* Jami Kartalari */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass glass-glow-success rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden shadow-md">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-brand-success border border-brand-success/15 flex items-center justify-center mb-2.5 shadow-inner">
            <ArrowDownLeft size={18} />
          </div>
          <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block">Menga qarz</span>
          <span className="text-base font-black text-brand-text truncate mt-0.5">
            {totalOwed.toLocaleString('uz-UZ')} UZS
          </span>
        </div>

        <div className="glass glass-glow-danger rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden shadow-md">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-brand-danger border border-brand-danger/15 flex items-center justify-center mb-2.5 shadow-inner">
            <ArrowUpRight size={18} />
          </div>
          <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block">Men qarzman</span>
          <span className="text-base font-black text-brand-text truncate mt-0.5">
            {totalOwing.toLocaleString('uz-UZ')} UZS
          </span>
        </div>
      </div>

      {/* Tab Navigatsiyasi */}
      <div className="flex bg-slate-950/80 p-1.5 rounded-2xl mb-6 border border-slate-900 shadow-inner">
        <button
          onClick={() => setActiveTab('owed')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'owed' 
              ? 'bg-slate-900 text-brand-primary border border-slate-800/40 shadow-md scale-102' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Menga qarzlar ({unpaidDebts.filter(d => d.type === 'owed').length})
        </button>
        <button
          onClick={() => setActiveTab('owing')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'owing' 
              ? 'bg-slate-900 text-brand-primary border border-slate-800/40 shadow-md scale-102' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Men qarzman ({unpaidDebts.filter(d => d.type === 'owing').length})
        </button>
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm animate-pulse">Yuklanmoqda...</div>
      ) : currentUnpaid.length === 0 && currentPaid.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-brand-muted text-sm border border-dashed border-slate-800/80">
          📓 Bu ro'yxatda faol qarzlar mavjud emas.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Faol qarzlar */}
          {currentUnpaid.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest pl-1">Faol qarzlar</h3>
              {currentUnpaid.map((d) => (
                <div key={d.id} className={`glass hover:bg-slate-900/40 border border-slate-950 hover:border-slate-800/30 rounded-2xl p-4 flex justify-between items-center transition-all duration-300 transform hover:-translate-y-0.5 shadow-md border-l-[4px] ${
                  activeTab === 'owed' ? 'border-l-brand-success' : 'border-l-brand-warning'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-brand-muted">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-text">{d.person_name}</h4>
                      <span className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                        {d.due_date ? (
                          <>
                            <Calendar size={11} className="text-brand-muted" /> Qaytarish muddati: {d.due_date}
                          </>
                        ) : (
                          <span className="italic">Muddatsiz</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-text mr-1">
                      {Number(d.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <button 
                      onClick={() => handleTogglePaid(d.id, d.is_paid)}
                      className="w-8 h-8 rounded-xl bg-brand-success/10 hover:bg-brand-success border border-brand-success/20 text-brand-success hover:text-slate-950 flex items-center justify-center transition-all duration-200"
                      title="To'landi deb belgilash"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleDeleteDebt(d.id)}
                      className="w-8 h-8 rounded-xl bg-brand-danger/10 hover:bg-brand-danger border border-brand-danger/20 text-brand-danger hover:text-slate-950 flex items-center justify-center transition-all duration-200"
                      title="O'chirish"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* To'langan qarzlar */}
          {currentPaid.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest pl-1">To'langan qarzlar</h3>
              {currentPaid.map((d) => (
                <div key={d.id} className="glass rounded-2xl p-4 flex justify-between items-center opacity-50 border-l-[4px] border-l-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-brand-muted opacity-60">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-text line-through">{d.person_name}</h4>
                      <span className="text-[9px] bg-slate-900 text-brand-success border border-brand-success/15 px-2 py-0.5 rounded-lg mt-0.5 inline-block font-semibold">To'langan</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-text line-through mr-1">
                      {Number(d.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <button 
                      onClick={() => handleTogglePaid(d.id, d.is_paid)}
                      className="w-14 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-brand-primary flex items-center justify-center gap-0.5 transition-all border border-slate-800"
                      title="Qayta faollashtirish"
                    >
                      <Undo2 size={10} /> Qaytar
                    </button>
                    <button 
                      onClick={() => handleDeleteDebt(d.id)}
                      className="w-8 h-8 rounded-xl bg-brand-danger/10 hover:bg-brand-danger border border-brand-danger/20 text-brand-danger hover:text-slate-950 flex items-center justify-center transition-all duration-200"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Yangi Qarz Qo'shish */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-slate-950/90 border border-slate-800/80 rounded-t-3xl rounded-b-xl p-6 animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-brand-text">Yangi Qarz Qayd Etish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-muted hover:text-brand-text text-sm font-medium">Yopish</button>
            </div>
            <form onSubmit={handleAddDebt} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Kim? (Ism-sharif)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Masalan: Anvar aka, Dilnoza"
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Mablag' (UZS)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masalan: 500000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Qarz turi</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238f9cae' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                >
                  <option value="owed" className="bg-slate-950 text-brand-text">Menga qarz (Owed)</option>
                  <option value="owing" className="bg-slate-950 text-brand-text">Men qarzman (Owing)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">Qaytarish muddati (ixtiyoriy)</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full glass-input rounded-2xl px-4 py-3.5 text-brand-text focus:outline-none"
                />
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
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
