import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, User, Undo2, X, BookOpen } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';

export default function Debts({ fetchWithAuth, debts, refreshDebts, triggerHaptic }) {
  const [activeTab, setActiveTab]   = useState('owed');
  const [showAddModal, setShowAddModal] = useState(false);

  // Swipe states
  const [swipedRowId, setSwipedRowId] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [dragTranslation, setDragTranslation] = useState(0);
  const [touchStartInfo, setTouchStartInfo] = useState({ x: 0, y: 0, startTrans: 0 });

  const handleTouchStart = (e, id) => {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    let startTrans = 0;
    if (swipedRowId === id) {
      startTrans = swipeDirection === 'left' ? -72 : 72;
    }
    setTouchStartInfo({ x, y, startTrans });
    setDraggedRowId(id);
    setDragTranslation(startTrans);
  };

  const handleTouchMove = (e, id) => {
    if (draggedRowId !== id) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartInfo.x;
    const diffY = currentY - touchStartInfo.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (e.cancelable) e.preventDefault();
      let newTrans = touchStartInfo.startTrans + diffX;
      newTrans = Math.max(-100, Math.min(100, newTrans));
      setDragTranslation(newTrans);
    }
  };

  const handleTouchEnd = (e, id) => {
    if (draggedRowId !== id) return;
    setDraggedRowId(null);
    if (dragTranslation < -36) {
      setSwipedRowId(id);
      setSwipeDirection('left');
      triggerHaptic?.('impact', 'light');
    } else if (dragTranslation > 36) {
      setSwipedRowId(id);
      setSwipeDirection('right');
      triggerHaptic?.('impact', 'light');
    } else {
      setSwipedRowId(null);
      setSwipeDirection(null);
    }
  };

  const [personName, setPersonName] = useState('');
  const [amount, setAmount]         = useState('');
  const [type, setType]             = useState('owed');
  const [dueDate, setDueDate]       = useState('');

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!personName || !amount || Number(amount) <= 0) {
      triggerHaptic?.('notification', 'error');
      return;
    }
    try {
      await fetchWithAuth('/api/debts', {
        method: 'POST',
        body: JSON.stringify({ person_name: personName, amount: parseFloat(amount), type, due_date: dueDate || null }),
      });
      setShowAddModal(false);
      setPersonName(''); setAmount(''); setType('owed'); setDueDate('');
      refreshDebts();
      triggerHaptic?.('notification', 'success');
    } catch (err) { 
      triggerHaptic?.('notification', 'error');
      console.error(err); 
    }
  };

  const handleTogglePaid = async (id, isPaid) => {
    try {
      await fetchWithAuth(`/api/debts/${id}`, { method: 'PATCH', body: JSON.stringify({ is_paid: !isPaid }) });
      refreshDebts();
      triggerHaptic?.('impact', 'light');
    } catch (err) { 
      triggerHaptic?.('notification', 'error');
      console.error(err); 
    }
  };

  const handleDeleteDebt = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await fetchWithAuth(`/api/debts/${id}`, { method: 'DELETE' });
      refreshDebts();
      triggerHaptic?.('impact', 'medium');
    } catch (err) { 
      triggerHaptic?.('notification', 'error');
      console.error(err); 
    }
  };

  const safeDebts    = Array.isArray(debts) ? debts : [];
  const unpaidDebts  = safeDebts.filter(d => !d.is_paid);
  const paidDebts    = safeDebts.filter(d => d.is_paid);
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
            onClick={() => { setActiveTab(t.key); triggerHaptic?.('selection'); }}
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
      {currentUnpaid.length === 0 && currentPaid.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-sm"
          style={{ color: 'var(--color-muted)', border: '1px dashed rgba(59,158,248,0.15)' }}>
          📓 Bu ro'yxatda qarzlar mavjud emas.
        </div>
      ) : (
        <div className="flex flex-col gap-5 overflow-hidden">
          {/* Active */}
          {currentUnpaid.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--color-muted)' }}>
                Faol qarzlar
              </h3>
              {currentUnpaid.map(d => {
                const isDragged = draggedRowId === d.id;
                const isSwiped = swipedRowId === d.id;
                const translateX = isDragged ? dragTranslation : (isSwiped ? (swipeDirection === 'left' ? -72 : 72) : 0);
                const transitionStyle = isDragged ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

                return (
                  <div key={d.id} className="relative select-none touch-pan-y overflow-hidden rounded-2xl">
                    {/* Left underlay (Complete) */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[72px] bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white cursor-pointer z-0 shadow-inner"
                      style={{
                        transform: `translateX(${-72 + Math.max(0, translateX)}px)`,
                        transition: transitionStyle,
                      }}
                      onClick={() => {
                        handleTogglePaid(d.id, d.is_paid);
                        setSwipedRowId(null);
                        setSwipeDirection(null);
                      }}
                    >
                      <Check size={18} strokeWidth={3} />
                    </div>

                    {/* Right underlay (Delete) */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-[72px] bg-gradient-to-l from-red-600 to-red-500 rounded-2xl flex items-center justify-center text-white cursor-pointer z-0 shadow-inner"
                      style={{
                        transform: `translateX(${72 + Math.min(0, translateX)}px)`,
                        transition: transitionStyle,
                      }}
                      onClick={() => {
                        handleDeleteDebt(d.id);
                        setSwipedRowId(null);
                        setSwipeDirection(null);
                      }}
                    >
                      <Trash2 size={16} />
                    </div>

                    {/* Swipable content */}
                    <div
                      className="glass rounded-2xl px-4 py-3.5 flex justify-between items-center relative z-10 transition-transform"
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftColor: activeTab === 'owed' ? '#10b981' : '#f59e0b',
                        borderColor: activeTab === 'owed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        transform: `translateX(${translateX}px)`,
                        transition: transitionStyle,
                      }}
                      onTouchStart={(e) => handleTouchStart(e, d.id)}
                      onTouchMove={(e) => handleTouchMove(e, d.id)}
                      onTouchEnd={(e) => handleTouchEnd(e, d.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(30,99,245,0.10)', border: '1px solid rgba(59,158,248,0.15)' }}>
                          <User size={16} style={{ color: 'var(--color-muted)' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>{d.person_name}</h4>
                          <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                            {d.due_date ? (
                              <><Calendar size={10} /> {d.due_date}</>
                            ) : (
                              <span className="italic">Muddatsiz</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-extrabold text-sm" style={{ color: 'var(--color-text)' }}>
                          {Number(d.amount).toLocaleString('uz-UZ')} UZS
                        </span>
                        {!isSwiped && (
                          <div className="w-1.5 h-6 rounded-full bg-gray-500/10 flex flex-col gap-0.5 items-center justify-center ml-1 shrink-0">
                            <div className="w-0.5 h-0.5 rounded-full bg-gray-500/40" />
                            <div className="w-0.5 h-0.5 rounded-full bg-gray-500/40" />
                            <div className="w-0.5 h-0.5 rounded-full bg-gray-500/40" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paid */}
          {currentPaid.length > 0 && (
            <div className="flex flex-col gap-2.5 opacity-60">
              <h3 className="text-[10px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--color-muted)' }}>
                To'langan
              </h3>
              {currentPaid.map(d => {
                const isDragged = draggedRowId === d.id;
                const isSwiped = swipedRowId === d.id;
                const translateX = isDragged ? dragTranslation : (isSwiped ? (swipeDirection === 'left' ? -72 : 72) : 0);
                const transitionStyle = isDragged ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

                return (
                  <div key={d.id} className="relative select-none touch-pan-y overflow-hidden rounded-2xl">
                    {/* Left underlay (Undo) */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[72px] bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center text-white cursor-pointer z-0 shadow-inner"
                      style={{
                        transform: `translateX(${-72 + Math.max(0, translateX)}px)`,
                        transition: transitionStyle,
                      }}
                      onClick={() => {
                        handleTogglePaid(d.id, d.is_paid);
                        setSwipedRowId(null);
                        setSwipeDirection(null);
                      }}
                    >
                      <Undo2 size={16} />
                    </div>

                    {/* Right underlay (Delete) */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-[72px] bg-gradient-to-l from-red-600 to-red-500 rounded-2xl flex items-center justify-center text-white cursor-pointer z-0 shadow-inner"
                      style={{
                        transform: `translateX(${72 + Math.min(0, translateX)}px)`,
                        transition: transitionStyle,
                      }}
                      onClick={() => {
                        handleDeleteDebt(d.id);
                        setSwipedRowId(null);
                        setSwipeDirection(null);
                      }}
                    >
                      <Trash2 size={16} />
                    </div>

                    {/* Swipable content */}
                    <div
                      className="glass rounded-2xl px-4 py-3.5 flex justify-between items-center relative z-10 transition-transform"
                      style={{ 
                        borderColor: 'rgba(59,158,248,0.08)',
                        transform: `translateX(${translateX}px)`,
                        transition: transitionStyle,
                      }}
                      onTouchStart={(e) => handleTouchStart(e, d.id)}
                      onTouchMove={(e) => handleTouchMove(e, d.id)}
                      onTouchEnd={(e) => handleTouchEnd(e, d.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(30,99,245,0.06)', border: '1px solid rgba(59,158,248,0.10)' }}>
                          <User size={16} style={{ color: 'var(--color-muted)' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm line-through truncate" style={{ color: 'var(--color-muted)' }}>{d.person_name}</h4>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-lg mt-0.5 inline-block"
                            style={{ color: '#10b981', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.15)' }}>
                            To'langan ✓
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-extrabold text-sm line-through" style={{ color: 'var(--color-muted)' }}>
                          {Number(d.amount).toLocaleString('uz-UZ')} UZS
                        </span>
                        {!isSwiped && (
                          <div className="w-1.5 h-6 rounded-full bg-gray-500/10 flex flex-col gap-0.5 items-center justify-center ml-1 shrink-0">
                            <div className="w-0.5 h-0.5 rounded-full bg-gray-500/40" />
                            <div className="w-0.5 h-0.5 rounded-full bg-gray-500/40" />
                            <div className="w-0.5 h-0.5 rounded-full bg-gray-500/40" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM SHEET: Add Debt */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Yangi Qarz"
      >
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
      </BottomSheet>
    </div>
  );
}
