import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

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
    <div className="pb-24 px-4 pt-4 animate-fade-in">
      {/* Sarlavha va Qo'shish */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-brand-text">Qarz Daftari</h2>
          <span className="text-xs text-brand-muted">Debts and credits notebook</span>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-brand-primary text-slate-950 font-bold px-3 py-2 rounded-xl text-sm"
        >
          <Plus size={16} /> Yangi qarz
        </button>
      </div>

      {/* Jami Kartalari */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-1 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-brand-success flex items-center justify-center mb-2">
            <ArrowDownLeft size={18} />
          </div>
          <span className="text-[10px] text-brand-muted uppercase block">Menga qarz</span>
          <span className="text-sm font-bold text-brand-text truncate">
            {totalOwed.toLocaleString('uz-UZ')} UZS
          </span>
        </div>

        <div className="glass rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-1 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-brand-danger flex items-center justify-center mb-2">
            <ArrowUpRight size={18} />
          </div>
          <span className="text-[10px] text-brand-muted uppercase block">Men qarzman</span>
          <span className="text-sm font-bold text-brand-text truncate">
            {totalOwing.toLocaleString('uz-UZ')} UZS
          </span>
        </div>
      </div>

      {/* Tab Navigatsiyasi */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl mb-5 border border-slate-800">
        <button
          onClick={() => setActiveTab('owed')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'owed' 
              ? 'bg-brand-card text-brand-primary shadow-lg' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Menga qarzlar ({unpaidDebts.filter(d => d.type === 'owed').length})
        </button>
        <button
          onClick={() => setActiveTab('owing')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'owing' 
              ? 'bg-brand-card text-brand-primary shadow-lg' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Men qarzman ({unpaidDebts.filter(d => d.type === 'owing').length})
        </button>
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm">Yuklanmoqda...</div>
      ) : currentUnpaid.length === 0 && currentPaid.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-brand-muted text-sm border border-dashed border-slate-700/50">
          📓 Bu ro'yxatda faol qarzlar mavjud emas.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Faol qarzlar */}
          {currentUnpaid.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider pl-1">Faol qarzlar</h3>
              {currentUnpaid.map((d) => (
                <div key={d.id} className="glass rounded-2xl p-4 flex justify-between items-center border-l-4 border-l-brand-warning">
                  <div>
                    <h4 className="font-bold text-sm text-brand-text">{d.person_name}</h4>
                    <span className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                      {d.due_date ? (
                        <>
                          <Calendar size={10} /> Muddati: {d.due_date}
                        </>
                      ) : (
                        'Muddatsiz'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-text mr-2">
                      {Number(d.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <button 
                      onClick={() => handleTogglePaid(d.id, d.is_paid)}
                      className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-brand-success flex items-center justify-center transition-colors"
                      title="To'landi deb belgilash"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteDebt(d.id)}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-brand-danger flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* To'langan qarzlar */}
          {currentPaid.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider pl-1">To'langan qarzlar</h3>
              {currentPaid.map((d) => (
                <div key={d.id} className="glass rounded-2xl p-4 flex justify-between items-center opacity-60 border-l-4 border-l-brand-success">
                  <div>
                    <h4 className="font-bold text-sm text-brand-text line-through">{d.person_name}</h4>
                    <span className="text-[10px] text-brand-success">To'langan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-text line-through mr-2">
                      {Number(d.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <button 
                      onClick={() => handleTogglePaid(d.id, d.is_paid)}
                      className="w-8 h-8 rounded-lg bg-slate-800 text-brand-muted hover:text-brand-text flex items-center justify-center transition-colors"
                      title="Qayta faollashtirish"
                    >
                      Undo
                    </button>
                    <button 
                      onClick={() => handleDeleteDebt(d.id)}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-brand-danger flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-brand-card rounded-t-3xl p-6 animate-fade-in border border-slate-700/50 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-brand-text">Yangi qarz kiritish</h3>
            <form onSubmit={handleAddDebt} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-brand-muted block mb-1">Kim? (Ism-sharif)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Masalan: Anvar aka, Umida"
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs text-brand-muted block mb-1">Mablag' (UZS)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masalan: 500000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs text-brand-muted block mb-1">Qarz turi</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                >
                  <option value="owed">Menga qarz (Owed)</option>
                  <option value="owing">Men qarzman (Owing)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-brand-muted block mb-1">Qaytarish muddati (ixtiyoriy)</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary"
                />
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
