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
    <div className="pb-24 px-4 pt-4 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-1.5">
            <Sparkles size={20} className="text-brand-primary animate-pulse" /> AI Maslahatchi
          </h2>
          <span className="text-xs text-brand-muted">Uzbek context-aware smart advisor</span>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading || generating}
          className="p-2.5 bg-slate-800 text-brand-primary rounded-xl hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
          title="Hisobotni yangilash"
        >
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-brand-muted text-sm">Hisobot yuklanmoqda...</div>
      ) : generating ? (
        <div className="glass rounded-3xl p-8 py-16 text-center border border-brand-primary/20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p className="text-sm font-medium text-brand-text max-w-xs animate-pulse">
            {loaderMessage}
          </p>
        </div>
      ) : !insight ? (
        <div className="glass rounded-3xl p-8 py-12 text-center border border-dashed border-slate-700/50 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h4 className="font-bold text-sm text-brand-text mb-1">Moliya tahlili mavjud emas</h4>
            <p className="text-xs text-brand-muted max-w-xs mx-auto">
              Xarajatlaringiz va qarz daftaringiz asosida AI maslahatchisining o'zbekona moliyaviy tavsiyalarini olish uchun quyidagi tugmani bosing.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="bg-brand-primary text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs"
          >
            Hisobot Yaratish
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Asosiy Maslahatlar Kartasi */}
          <div className="glass rounded-3xl p-6 border-l-4 border-l-brand-primary relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-brand-primary bg-brand-primary/10 font-bold px-2 py-0.5 rounded-full uppercase">
                Hamyon AI Tahlili
              </span>
              <span className="text-[10px] text-brand-muted">
                {new Date(insight.generated_at).toLocaleString('uz-UZ')}
              </span>
            </div>

            {/* Markdown formatida chiqqan tavsiyani chiroyli render qilish (tizimda \n orqali ajratilgan) */}
            <div className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap flex flex-col gap-3">
              {insight.insight_text}
            </div>
          </div>

          {/* Eslatma va ogohlantirish */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-3 text-xs text-brand-muted">
            <AlertTriangle className="text-brand-warning shrink-0" size={16} />
            <div>
              <strong className="text-brand-text block mb-0.5">Eslatma:</strong>
              Ushbu maslahatlar sun'iy intellekt tomonidan taqdim etilgan bo'lib, xarajatlar tahlili va milliy kontekstga asoslangan tavsiyaviy xarakterga ega.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
