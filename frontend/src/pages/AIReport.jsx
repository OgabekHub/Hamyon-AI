import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

const LOADER_MESSAGES = [
  "🧠 Hamyon AI xarajatlaringizni o'rganmoqda...",
  "🌙 Mavsumiy ta'sirlarni hisoblamoqda...",
  "🚗 Transport xarajatlarini taqqoslamoqda...",
  "🛒 Oziq-ovqat sarfiyatlarini tahlil qilmoqda...",
  "💡 Maxsus tejash maslahatlarini yozmoqda...",
];

export default function AIReport({ fetchWithAuth }) {
  const [insight, setInsight]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(LOADER_MESSAGES[0]);

  useEffect(() => { loadInsight(); }, []);

  useEffect(() => {
    let iv;
    if (generating) {
      let i = 0;
      iv = setInterval(() => { i = (i + 1) % LOADER_MESSAGES.length; setLoaderMessage(LOADER_MESSAGES[i]); }, 3000);
    }
    return () => clearInterval(iv);
  }, [generating]);

  const loadInsight = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/api/insights');
      setInsight(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setLoaderMessage(LOADER_MESSAGES[0]);
      const data = await fetchWithAuth('/api/insights/generate', { method: 'POST' });
      setInsight(data);
    } catch {
      alert("AI hisobot tayyorlashda xatolik. Keyinroq urinib ko'ring.");
    } finally {
      setGenerating(false);
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
        <button
          onClick={handleGenerate}
          disabled={loading || generating}
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
      </div>

      {/* States */}
      {loading ? (
        <div className="text-center py-16 text-sm animate-pulse" style={{ color: 'var(--color-muted)' }}>
          Yuklanmoqda...
        </div>
      ) : generating ? (
        <div className="glass rounded-3xl p-6 py-16 text-center flex flex-col items-center gap-5"
          style={{ border: '1px solid rgba(59,158,248,0.15)' }}>
          {/* Custom spinner */}
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

      ) : !insight ? (
        /* Empty state */
        <div className="glass rounded-3xl p-8 py-12 text-center flex flex-col items-center gap-5"
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
        /* Insight card */
        <div className="flex flex-col gap-5">
          {/* Main card */}
          <div className="glass-glow-primary rounded-3xl p-6 relative overflow-hidden"
            style={{ background: 'var(--color-glass-bg)' }}>
            {/* Decorative glow blobs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(59,158,248,0.10) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(30,99,245,0.08) 0%, transparent 70%)' }} />

            {/* Badge row */}
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
                {new Date(insight.generated_at).toLocaleString('uz-UZ')}
              </span>
            </div>

            {/* Parsed insight text */}
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

          {/* Disclaimer */}
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
    </div>
  );
}
