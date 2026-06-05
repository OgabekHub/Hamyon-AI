import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, User, Undo2, X, BookOpen } from 'lucide-react';

export default function Debts({ fetchWithAuth }) {
  const [debts, setDebts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('owed');
  const [showAddModal, setShowAddModal] = useState(false);

  const [personName, setPersonName] = useState('');
  const [amount, setAmount]         = useState('');
  const [type, setType]             = useState('owed');
  const [dueDate, setDueDate]       = useState('');

  useEffect(() => { loadDebts(); }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/api/debts');
      setDebts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!personName || !amount || Number(amount) <= 0) return;
    try {
      await fetchWithAuth('/api/debts', {
        method: 'POST',
        body: JSON.stringify({ person_name: personName, amount: parseFloat(amount), type, due_date: dueDate || null }),
      });
      setShowAddModal(false);
      setPersonName(''); setAmount(''); setType('owed'); setDueDate('');
      loadDebts();
    } catch (err) { console.error(err); }
  };

  const handleTogglePaid = async (id, isPaid) => {
    try {
      await fetchWithAuth(`/api/debts/${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: !isPaid }) });
      loadDebts();
    } catch (err) { console.error(err); }
  };

  const handleDeleteDebt = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await fetchWithAuth(`/api/debts/${id}`, { method: 'DELETE' });
      loadDebts();
    } catch (err) { console.error(err); }
  };

  const unpaidDebts  = debts.filter(d => !d.is_paid);
  const paidDebts    = debts.filter(d => d.is_paid);
  const currentUnpaid = unpaidDebts.filter(d => d.type === activeTab);
  const currentPaid   = paidDebts.filter(d => d.type === activeTab);
  const totalOwed    = unpaidDebts.filter(d => d.type === 'owed').reduce((s, d) => s + Number(d.amount), 0);
  const totalOwing   = unpaidDebts.filter(d => d.type === 'owing').reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="pb-28 px-4 pt-5 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0d1b4b, #1e63f5)' }}>
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
              Qarz Daftari
            </h2>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white btn-primary"
        >
          <Plus size={15} strokeWidth={2.5} /> Yangi
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="glass rounded-2xl p-4 flex flex-col gap-2"
          style={{ borderColor: 'rgba(16,185,129,0.20)', borderLeftWidth: '3px', borderLeftColor: '#10b981' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <ArrowDownLeft size={16} style={{ color: '#10b981' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Menga qarz
          </span>
          <span className="text-sm font-extrabold truncate" style={{ color: 'var(--color-text)' }}>
            {totalOwed.toLocaleString('uz-UZ')} UZS
          </span>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col gap-2"
          style={{ borderColor: 'rgba(244,63,94,0.20)', borderLeftWidth: '3px', borderLeftColor: '#f43f5e' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)' }}>
            <ArrowUpRight size={16} style={{ color: '#f43f5e' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Men qarzman
          </span>
          <span className="text-sm font-extrabold truncate" style={{ color: 'var(--color-text)' }}>
            {totalOwing.toLocaleString('uz-UZ')} UZS
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex p-1 rounded-2xl mb-5 gap-1"
        style={{ background: 'rgba(13,27,75,0.12)', border: '1px solid rgba(59,158,248,0.12)' }}>
        {[
          { key: 'owed',  label: `Menga qarz (${unpaidDebts.filter(d => d.type === 'owed').length})` },
          { key: 'owing', label: `Men qarzman (${unpaidDebts.filter(d => d.type === 'owing').length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200"
            style={
              activeTab === t.key
                ? { background: 'linear-gradient(135deg, #1e63f5, #3b9ef8)', color: '#fff', boxShadow: '0 0 14px rgba(30,99,245,0.30)' }
                : { color: 'var(--color-muted)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Debt list */}
      {loading ? (
        <div className="text-center py-16 text-sm animate-pulse" style={{ color: 'var(--color-muted)' }}>
          Yuklanmoqda...
        </div>
      ) : currentUnpaid.length === 0 && currentPaid.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-sm"
          style={{ color: 'var(--color-muted)', border: '1px dashed rgba(59,158,248,0.15)' }}>
          📓 Bu ro'yxatda qarzlar mavjud emas.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Active */}
          {currentUnpaid.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--color-muted)' }}>
                Faol qarzlar
              </h3>
              {currentUnpaid.map(d => (
                <div key={d.id} className="glass rounded-2xl px-4 py-3.5 flex justify-between items-center transition-all hover:-translate-y-0.5"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: activeTab === 'owed' ? '#10b981' : '#f59e0b',
                    borderColor: activeTab === 'owed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(30,99,245,0.10)', border: '1px solid rgba(59,158,248,0.15)' }}>
                      <User size={16} style={{ color: 'var(--color-muted)' }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{d.person_name}</h4>
                      <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                        {d.due_date ? (
                          <><Calendar size={10} /> {d.due_date}</>
                        ) : (
                          <span className="italic">Muddatsiz</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm" style={{ color: 'var(--color-text)' }}>
                      {Number(d.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <button onClick={() => handleTogglePaid(d.id, d.is_paid)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)', color: '#10b981' }}
                      title="To'landi">
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDeleteDebt(d.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e' }}
                      title="O'chirish">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paid */}
          {currentPaid.length > 0 && (
            <div className="flex flex-col gap-2.5 opacity-60">
              <h3 className="text-[10px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--color-muted)' }}>
                To'langan
              </h3>
              {currentPaid.map(d => (
                <div key={d.id} className="glass rounded-2xl px-4 py-3.5 flex justify-between items-center"
                  style={{ borderColor: 'rgba(59,158,248,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(30,99,245,0.06)', border: '1px solid rgba(59,158,248,0.10)' }}>
                      <User size={16} style={{ color: 'var(--color-muted)' }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm line-through" style={{ color: 'var(--color-muted)' }}>{d.person_name}</h4>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-lg mt-0.5 inline-block"
                        style={{ color: '#10b981', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        To'langan ✓
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm line-through" style={{ color: 'var(--color-muted)' }}>
                      {Number(d.amount).toLocaleString('uz-UZ')} UZS
                    </span>
                    <button onClick={() => handleTogglePaid(d.id, d.is_paid)}
                      className="px-3 h-8 rounded-xl flex items-center gap-1 text-[10px] font-bold transition-all"
                      style={{ background: 'rgba(59,158,248,0.08)', border: '1px solid rgba(59,158,248,0.15)', color: 'var(--color-primary)' }}>
                      <Undo2 size={10} /> Qaytar
                    </button>
                    <button onClick={() => handleDeleteDebt(d.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.12)', color: '#f43f5e' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Debt */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{ background: 'rgba(4,8,16,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid rgba(59,158,248,0.20)',
              boxShadow: '0 -20px 60px rgba(13,27,75,0.40)',
            }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-extrabold" style={{ color: 'var(--color-text)' }}>Yangi Qarz</h3>
              <button onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl" style={{ background: 'rgba(59,158,248,0.08)', color: 'var(--color-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="flex flex-col gap-3.5">
              {[
                { label: "Kim? (Ism-sharif)", type: 'text',   val: personName, setVal: setPersonName, placeholder: 'Masalan: Anvar aka' },
                { label: "Mablag' (UZS)",     type: 'number', val: amount,     setVal: setAmount,     placeholder: '500000' },
              ].map(({ label, type: t, val, setVal, placeholder }) => (
                <div key={label}>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
                    style={{ color: 'var(--color-muted)' }}>{label}</label>
                  <input type={t} required placeholder={placeholder}
                    value={val} onChange={e => setVal(e.target.value)}
                    className="w-full glass-input px-4 py-3.5 text-sm"
                    style={{ color: 'var(--color-text)' }} />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
                  style={{ color: 'var(--color-muted)' }}>Qarz turi</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full glass-input px-4 py-3.5 text-sm appearance-none"
                  style={{ color: 'var(--color-text)' }}>
                  <option value="owed"  style={{ background: 'var(--color-bg)' }}>Menga qarz (Owed)</option>
                  <option value="owing" style={{ background: 'var(--color-bg)' }}>Men qarzman (Owing)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
                  style={{ color: 'var(--color-muted)' }}>Qaytarish muddati (ixtiyoriy)</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full glass-input px-4 py-3.5 text-sm"
                  style={{ color: 'var(--color-text)' }} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(59,158,248,0.06)', border: '1px solid rgba(59,158,248,0.16)', color: 'var(--color-muted)' }}>
                  Bekor
                </button>
                <button type="submit"
                  className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider text-white btn-primary">
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
