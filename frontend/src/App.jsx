import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Debts from './pages/Debts';
import AIReport from './pages/AIReport';
import { LayoutDashboard, History, Target, BookOpen, Sparkles, Sun, Moon, Wallet } from 'lucide-react';
import logoImg from './assets/logo.png';

const NAV_TABS = [
  { key: 'home',         label: 'Bosh',     Icon: LayoutDashboard },
  { key: 'transactions', label: 'Xarajat',  Icon: History },
  { key: 'budget',       label: 'Budjet',   Icon: Target },
  { key: 'debts',        label: 'Qarzlar',  Icon: BookOpen },
  { key: 'ai_report',   label: 'AI',        Icon: Sparkles },
];

export default function App() {
  const { user, loading, fetchWithAuth } = useTelegram();
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 20% 0%, #0d1630 0%, #040810 100%)' }}>
        {/* Animated logo/spinner */}
        <div className="relative mb-6">
          <img src={logoImg} alt="Hamyon AI Logo" className="h-16 w-auto object-contain animate-float" />
        </div>
        <p className="text-sm font-bold tracking-widest uppercase"
          style={{ color: '#3b9ef8' }}>
          Hamyon AI
        </p>
        <p className="text-xs mt-1" style={{ color: '#7fa8d4' }}>yuklanmoqda...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':         return <Dashboard fetchWithAuth={fetchWithAuth} user={user} setActiveTab={setActiveTab} />;
      case 'transactions': return <Transactions fetchWithAuth={fetchWithAuth} />;
      case 'budget':       return <Budget fetchWithAuth={fetchWithAuth} />;
      case 'debts':        return <Debts fetchWithAuth={fetchWithAuth} />;
      case 'ai_report':    return <AIReport fetchWithAuth={fetchWithAuth} />;
      default:             return <Dashboard fetchWithAuth={fetchWithAuth} user={user} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="h-full flex flex-col max-w-md mx-auto relative min-h-screen transition-colors duration-300"
      style={{ background: 'var(--color-bg)' }}>

      {/* ── Global Header ── */}
      <div className="px-4 py-3 flex justify-between items-center relative z-30"
        style={{
          background: 'rgba(13,27,75,0.06)',
          borderBottom: '1px solid rgba(59,158,248,0.12)',
          backdropFilter: 'blur(12px)',
        }}>
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Hamyon AI Logo" className="h-7 w-auto object-contain" style={{ position: 'relative', top: '-1.5px' }} />
          <span className="text-sm font-black tracking-widest uppercase"
            style={{ color: 'var(--color-primary)' }}>
            Hamyon AI
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border transition-all duration-200 active:scale-90"
          style={{
            background: 'rgba(30,99,245,0.08)',
            border: '1px solid rgba(59,158,248,0.20)',
            color: 'var(--color-primary)',
          }}
          title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-28 scrollbar-none">
        <div className="animate-fade-in">{renderContent()}</div>
      </div>

      {/* ── Premium Floating Bottom Tab Bar ── */}
      <div
        className="fixed bottom-4 left-4 right-4 z-40 flex justify-around items-center px-2 py-2 rounded-2xl max-w-sm mx-auto"
        style={{
          background: theme === 'dark'
            ? 'rgba(7, 12, 26, 0.90)'
            : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(59,158,248,0.20)',
          boxShadow: '0 8px 32px rgba(13,27,75,0.30), 0 1px 0 rgba(255,255,255,0.06) inset',
        }}>
        {NAV_TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {/* Active bg pill */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(30,99,245,0.12)' }}
                />
              )}
              <Icon
                size={20}
                style={{
                  filter: isActive
                    ? 'drop-shadow(0 0 6px rgba(59,158,248,0.7))'
                    : 'none',
                }}
              />
              <span className="text-[9px] tracking-wide z-10">{label}</span>
              {/* Active dot */}
              {isActive && (
                <span
                  className="absolute -bottom-1 w-1 h-1 rounded-full animate-ping"
                  style={{ background: 'var(--color-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
