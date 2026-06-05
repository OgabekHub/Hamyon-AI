import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, BookOpen, AlertTriangle } from 'lucide-react';

const LOADER_MESSAGES = [
  "🧠 Hamyon AI xarajatlaringizni o'rganmoqda...",
  "🌙 Ramazon va hayit bayramlari ta'sirini hisoblamoqda...",
  "🚗 Bolt va Yandex taksi sarfiyatlarini taqqoslamoqda...",
  "🛒 Korzinka va bozor-o'char narxlarini tahlil qilmoqda...",
  "💡 Siz uchun maxsus tejash sirlarini yozmoqda..."
];

export default function AIReport({ fetchWithAuth }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(LOADER_MESSAGES[0]);

  useEffect(() => {
    loadInsight();
  }, []);

  useEffect(() => {
    let interval;
    if (generating) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADER_MESSAGES.length;
        setLoaderMessage(LOADER_MESSAGES[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const loadInsight = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/api/insights');
      setInsight(data);
    } catch (err) {
      console.error('AI hisobot yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setLoaderMessage(LOADER_MESSAGES[0]);
      const data = await fetchWithAuth('/api/insights/generate', {
        method: 'POST'
      });
      setInsight(data);
    } catch (err) {
      console.error('AI hisobot yaratishda xatolik:', err);
      alert('AI hisobot tayyorlashda xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="pb-24 px-4 pt-5 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-brand-text flex items-center gap-2 tracking-tight">
            <Sparkles size={20} className="text-brand-primary animate-pulse drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" /> AI Maslahatchi
          </h2>
          <span className="text-xs text-brand-muted font-medium">Shaxsiy moliyaviy yordamchingiz</span>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading || generating}
          className="p-2.5 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 text-brand-primary rounded-xl transition-all disabled:opacity-50"
          title="Hisobotni yangilash"
        >
          <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm animate-pulse">Hisobot yuklanmoqda...</div>
      ) : generating ? (
        <div className="glass rounded-3xl p-6 py-16 text-center border border-brand-primary/10 flex flex-col items-center justify-center gap-5 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin shadow-[0_0_15px_rgba(0,229,255,0.2)]"></div>
          <div className="flex flex-col gap-2 w-full max-w-[200px] mt-1">
            <div className="h-1.5 bg-slate-950 rounded-full animate-pulse"></div>
            <div className="h-2 bg-slate-950 rounded-full animate-pulse w-5/6 mx-auto"></div>
            <div className="h-1.5 bg-slate-950 rounded-full animate-pulse w-2/3 mx-auto"></div>
          </div>
          <p className="text-xs font-semibold text-brand-primary max-w-xs animate-pulse tracking-wide leading-relaxed">
            {loaderMessage}
          </p>
        </div>
      ) : !insight ? (
        <div className="glass rounded-3xl p-8 py-12 text-center border border-dashed border-slate-800/80 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-2xl shadow-inner">🤖</div>
          <div>
            <h4 className="font-extrabold text-sm text-brand-text mb-1 tracking-tight">AI Moliyaviy Tahlili Mavjud Emas</h4>
            <p className="text-xs text-brand-muted max-w-xs mx-auto leading-relaxed mt-1">
              Xarajatlaringiz va qarz daftaringiz asosida sun'iy intellektdan o'zbekona moliyaviy tavsiyalar olish uchun quyidagi tugmani bosing.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-brand-primary to-brand-primary/80 text-slate-950 font-extrabold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:scale-103 transition-all"
          >
            Tahlil Yaratish
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Asosiy Maslahatlar Kartasi */}
          <div className="glass glass-glow-primary rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-900">
              <span className="text-[9px] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">
                Hamyon AI Tahlili
              </span>
              <span className="text-[10px] text-brand-muted font-medium">
                {new Date(insight.generated_at).toLocaleString('uz-UZ')}
              </span>
            </div>

            {/* Premium formatlangan AI matni */}
            <div className="flex flex-col gap-4">
              {insight.insight_text.split('\n').map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Headers
                const isHeader = trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**'));
                // Bullet points
                const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*') && !trimmed.endsWith('**');

                if (isHeader) {
                  return (
                    <h4 key={index} className="text-xs font-black text-brand-primary uppercase tracking-widest mt-4 flex items-center gap-2 pb-1 border-b border-slate-950/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary inline-block"></span>
                      {trimmed.replace(/###|\*\*/g, '').trim()}
                    </h4>
                  );
                }
                
                if (isBullet) {
                  return (
                    <div key={index} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-brand-muted pl-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 mt-2 shadow-[0_0_6px_#00e5ff]"></span>
                      <span className="font-medium text-brand-muted/95">{trimmed.replace(/^-\s*|^\*\s*/, '').trim()}</span>
                    </div>
                  );
                }

                // Normal Paragraph
                return (
                  <p key={index} className="text-[11px] text-brand-text/90 leading-relaxed font-medium mt-1">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Eslatma va ogohlantirish */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex gap-3 text-[10px] text-brand-muted shadow-sm">
            <AlertTriangle className="text-brand-warning shrink-0" size={16} />
            <div>
              <strong className="text-brand-text block mb-0.5 font-bold uppercase tracking-wider">Eslatma:</strong>
              Ushbu maslahatlar sun'iy intellekt tomonidan taqdim etilgan bo'lib, xarajatlar tahlili va milliy kontekstga asoslangan tavsiyaviy xarakterga ega.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
