import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Send, MessageSquare } from 'lucide-react';

const LOADER_MESSAGES = [
  "🧠 Hamyon AI xarajatlaringizni o'rganmoqda...",
  "🌙 Mavsumiy ta'sirlarni hisoblamoqda...",
  "🚗 Transport xarajatlarini taqqoslamoqda...",
  "🛒 Oziq-ovqat sarfiyatlarini tahlil qilmoqda...",
  "💡 Maxsus tejash maslahatlarini yozmoqda...",
];

const QUICK_SUGGESTIONS = [
  { text: "Qanday pul tejash mumkin? 💡", query: "Qanday qilib pul tejashim mumkin?" },
  { text: "Taksi xarajatlarim ko'pmi? 🚗", query: "Transport va taksiga ko'p xarajat qilyapmanmi?" },
  { text: "Qarzlarim haqida tahlil bering 📓", query: "Mening qarzlarim qanday holatda? Tahlil bering." },
];

export default function AIReport({ fetchWithAuth, insight, refreshInsight, triggerHaptic }) {
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'chat'
  const [generating, setGenerating]     = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(LOADER_MESSAGES[0]);

  // Chat states
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: "Salom! Men Hamyon AI shaxsiy moliyaviy yordamchingizman. Xarajatlaringiz, budjet limitlari va qarzlar bo'yicha maslahat berishga tayyorman. Menga istalgan savolingizni berishingiz mumkin! 🧠💬" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    let iv;
    if (generating) {
      let i = 0;
      iv = setInterval(() => { i = (i + 1) % LOADER_MESSAGES.length; setLoaderMessage(LOADER_MESSAGES[i]); }, 3000);
    }
    return () => clearInterval(iv);
  }, [generating]);

  const handleGenerate = async () => {
    try {
      triggerHaptic?.('impact', 'light');
      setGenerating(true);
      setLoaderMessage(LOADER_MESSAGES[0]);
      await fetchWithAuth('/api/insights/generate', { method: 'POST' });
      await refreshInsight();
      triggerHaptic?.('notification', 'success');
    } catch {
      triggerHaptic?.('notification', 'error');
      alert("AI hisobot tayyorlashda xatolik. Keyinroq urinib ko'ring.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendMessage = async (userText) => {
    if (!userText.trim() || sendingMessage) return;

    setInputMessage('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSendingMessage(true);
    triggerHaptic?.('impact', 'light');

    try {
      const res = await fetchWithAuth('/api/insights/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText }),
      });
      setMessages(prev => [...prev, { sender: 'ai', text: res.response }]);
      triggerHaptic?.('notification', 'success');
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Kechirasiz, xabaringizga javob olishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring." }]);
      triggerHaptic?.('notification', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="pb-28 px-4 pt-5 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2"
            style={{ color: 'var(--color-text)' }}>
            <Sparkles
              size={20}
              className="animate-pulse"
              style={{ color: 'var(--color-primary)', filter: 'drop-shadow(0 0 8px rgba(59,158,248,0.6))' }}
            />
            AI Maslahatchi
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Shaxsiy moliyaviy yordamchingiz
          </p>
        </div>
        
        {activeTab === 'report' && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="p-2.5 rounded-xl transition-all disabled:opacity-40"
            style={{
              background: 'rgba(30,99,245,0.10)',
              border: '1px solid rgba(59,158,248,0.20)',
              color: 'var(--color-primary)',
            }}
            title="Hisobotni yangilash"
          >
            <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 rounded-2xl mb-5 gap-1"
        style={{ background: 'rgba(13,27,75,0.12)', border: '1px solid rgba(59,158,248,0.12)' }}>
        {[
          { key: 'report', label: 'Tahlil (Insights)', Icon: Sparkles },
          { key: 'chat',   label: 'Muloqot (Chat)', Icon: MessageSquare },
        ].map(t => {
          const IconComp = t.Icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); triggerHaptic?.('selection'); }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
              style={
                isActive
                  ? { background: 'linear-gradient(135deg, #1e63f5, #3b9ef8)', color: '#fff', boxShadow: '0 0 14px rgba(30,99,245,0.30)' }
                  : { color: 'var(--color-muted)' }
              }
            >
              <IconComp size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'report' ? (
        <>
          {generating ? (
            <div className="glass rounded-3xl p-6 py-16 text-center flex flex-col items-center gap-5 animate-scale-in"
              style={{ border: '1px solid rgba(59,158,248,0.15)' }}>
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(59,158,248,0.20)', borderTopColor: 'transparent' }} />
                <div className="absolute inset-1 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(30,99,245,0.40)', borderTopColor: 'transparent', animationDuration: '0.7s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
              </div>
              <p className="text-xs font-semibold max-w-xs animate-pulse leading-relaxed"
                style={{ color: 'var(--color-primary)' }}>
                {loaderMessage}
              </p>
            </div>

          ) : (!insight || !insight.insight_text) ? (
            <div className="glass rounded-3xl p-8 py-12 text-center flex flex-col items-center gap-5 animate-scale-in"
              style={{ border: '1px dashed rgba(59,158,248,0.18)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-float"
                style={{ background: 'linear-gradient(135deg, #0d1b4b, #1e63f5)' }}>
                🤖
              </div>
              <div>
                <h4 className="font-extrabold text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                  AI Tahlili Mavjud Emas
                </h4>
                <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  Xarajatlaringiz asosida o'zbekona moliyaviy tavsiyalar olish uchun quyidagi tugmani bosing.
                </p>
              </div>
              <button onClick={handleGenerate}
                className="px-6 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wider text-white btn-primary">
                ✨ Tahlil Yaratish
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-5 animate-scale-in">
              <div className="glass-glow-primary rounded-3xl p-6 relative overflow-hidden"
                style={{ background: 'var(--color-glass-bg)' }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(59,158,248,0.10) 0%, transparent 70%)' }} />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(30,99,245,0.08) 0%, transparent 70%)' }} />

                <div className="flex items-center gap-3 mb-5 pb-4 relative z-10"
                  style={{ borderBottom: '1px solid rgba(59,158,248,0.12)' }}>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-xl"
                    style={{
                      color: 'var(--color-primary)',
                      background: 'rgba(30,99,245,0.10)',
                      border: '1px solid rgba(59,158,248,0.20)',
                    }}>
                    Hamyon AI Tahlili
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    {insight.generated_at ? new Date(insight.generated_at).toLocaleString('uz-UZ') : ''}
                  </span>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                  {insight.insight_text.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    const isHeader = trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**'));
                    const isBullet = trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.endsWith('**'));

                    if (isHeader) {
                      return (
                        <h4 key={idx}
                          className="text-xs font-black uppercase tracking-widest mt-3 flex items-center gap-2 pb-1"
                          style={{
                            color: 'var(--color-primary)',
                            borderBottom: '1px solid rgba(59,158,248,0.10)',
                          }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--color-primary)' }} />
                          {trimmed.replace(/###|\*\*/g, '').trim()}
                        </h4>
                      );
                    }
                    if (isBullet) {
                      return (
                        <div key={idx} className="flex items-start gap-2.5 text-[11px] leading-relaxed pl-2">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                            style={{ background: 'var(--color-primary)', boxShadow: '0 0 5px rgba(59,158,248,0.5)' }} />
                          <span style={{ color: 'var(--color-muted)' }}>
                            {trimmed.replace(/^-\s*|^\*\s*/, '').trim()}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text)' }}>
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>

              <div className="glass rounded-2xl p-4 flex gap-3 text-[10px]"
                style={{ border: '1px solid rgba(245,158,11,0.15)' }}>
                <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                <div style={{ color: 'var(--color-muted)' }}>
                  <strong className="block mb-0.5 uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                    Eslatma:
                  </strong>
                  Ushbu maslahatlar sun'iy intellekt tomonidan taqdim etilgan bo'lib, tavsiyaviy xarakterga ega.
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Chat Panel */
        <div className="glass rounded-3xl p-4 flex flex-col h-[55vh] justify-between animate-scale-in"
          style={{ border: '1px solid rgba(59,158,248,0.15)' }}>
          
          {/* Message History */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 scrollbar-none mb-3">
            {messages.map((m, idx) => {
              const isAI = m.sender === 'ai';
              return (
                <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  <div 
                    className="max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed"
                    style={
                      isAI
                        ? {
                            background: 'rgba(59,158,248,0.08)',
                            border: '1px solid rgba(59,158,248,0.15)',
                            color: 'var(--color-text)',
                            borderBottomLeftRadius: '4px',
                          }
                        : {
                            background: 'linear-gradient(135deg, #1e63f5, #3b9ef8)',
                            color: '#ffffff',
                            borderBottomRightRadius: '4px',
                            boxShadow: '0 4px 12px rgba(30,99,245,0.15)',
                          }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            
            {sendingMessage && (
              <div className="flex justify-start animate-pulse">
                <div className="rounded-2xl px-4 py-3 text-xs italic"
                  style={{
                    background: 'rgba(59,158,248,0.04)',
                    border: '1px dashed rgba(59,158,248,0.10)',
                    color: 'var(--color-muted)',
                    borderBottomLeftRadius: '4px',
                  }}>
                  ✍️ Hamyon AI javob yozmoqda...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick recommendations chips */}
          {messages.length === 1 && !sendingMessage && (
            <div className="flex flex-col gap-1.5 mb-3">
              <span className="text-[9px] font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--color-muted)' }}>
                Tavsiya etilgan savollar:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s.query)}
                    className="glass px-3 py-2 rounded-xl text-[10px] font-semibold whitespace-nowrap active:scale-95 transition-all text-left shrink-0"
                    style={{
                      background: 'rgba(59,158,248,0.06)',
                      borderColor: 'rgba(59,158,248,0.12)',
                      color: 'var(--color-text)'
                    }}
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }} 
            className="flex gap-2 items-center pt-2"
            style={{ borderTop: '1px solid rgba(59,158,248,0.10)' }}
          >
            <input
              type="text"
              required
              disabled={sendingMessage}
              placeholder="Suring yoki savol bering..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              className="flex-1 glass-input px-4 py-3 text-xs"
              style={{ color: 'var(--color-text)' }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sendingMessage}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 active:scale-90 transition-all disabled:opacity-40 btn-primary"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
