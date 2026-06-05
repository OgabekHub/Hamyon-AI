import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Debts from './pages/Debts';
import AIReport from './pages/AIReport';
import { LayoutDashboard, History, Target, BookOpen, Sparkles, Sun, Moon } from 'lucide-react';

export default function App() {
  const { user, loading, fetchWithAuth } = useTelegram();
  const [activeTab, setActiveTab] = useState('home'); // home, transactions, budget, debts, ai_report
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-brand-bg text-brand-text min-h-screen">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_var(--color-primary-glow)]"></div>
        <p className="text-sm font-semibold animate-pulse text-brand-primary tracking-wider">Hamyon AI yuklanmoqda...</p>
      </div>
    );
  }

  // Sahifalarni render qilish
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard fetchWithAuth={fetchWithAuth} user={user} setActiveTab={setActiveTab} />;
      case 'transactions':
        return <Transactions fetchWithAuth={fetchWithAuth} />;
      case 'budget':
        return <Budget fetchWithAuth={fetchWithAuth} />;
      case 'debts':
        return <Debts fetchWithAuth={fetchWithAuth} />;
      case 'ai_report':
        return <AIReport fetchWithAuth={fetchWithAuth} />;
      default:
        return <Dashboard fetchWithAuth={fetchWithAuth} user={user} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="h-full flex flex-col justify-between max-w-md mx-auto relative bg-brand-bg min-h-screen transition-colors duration-300">
      
      {/* Global Header Bar */}
      <div className="px-4 py-3.5 flex justify-between items-center border-b border-slate-900/10 dark:border-slate-800/40 relative z-30 bg-slate-900/5 dark:bg-transparent">
        <span className="text-xs font-black tracking-widest text-brand-primary uppercase">Hamyon AI</span>
        <button 
          onClick={toggleTheme}
          className="p-2 bg-brand-card hover:bg-brand-primary/10 border border-slate-900/10 dark:border-slate-800/40 rounded-xl text-brand-primary transition-all duration-200 active:scale-95"
          title={theme === 'dark' ? "Kunduzgi rejim" : "Tungi rejim"}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Asosiy Kontent oqimi */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>

      {/* Floating Premium Bottom Tab Bar */}
      <div className="fixed bottom-6 left-4 right-4 z-40 bg-brand-card backdrop-blur-xl border border-slate-900/15 dark:border-slate-800/40 px-3 py-2.5 flex justify-around items-center max-w-sm mx-auto rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-300 relative ${
            activeTab === 'home' 
              ? 'text-brand-primary scale-110 font-bold' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <LayoutDashboard size={20} className={activeTab === 'home' ? 'drop-shadow-[0_0_8px_var(--color-primary-glow)]' : ''} />
          <span className="text-[10px] tracking-wide">Dashboard</span>
          {activeTab === 'home' && (
            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full animate-ping"></span>
          )}
        </button>

        {/* Transactions */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-300 relative ${
            activeTab === 'transactions' 
              ? 'text-brand-primary scale-110 font-bold' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <History size={20} className={activeTab === 'transactions' ? 'drop-shadow-[0_0_8px_var(--color-primary-glow)]' : ''} />
          <span className="text-[10px] tracking-wide">Xarajatlar</span>
          {activeTab === 'transactions' && (
            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full animate-ping"></span>
          )}
        </button>

        {/* Budget */}
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-300 relative ${
            activeTab === 'budget' 
              ? 'text-brand-primary scale-110 font-bold' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Target size={20} className={activeTab === 'budget' ? 'drop-shadow-[0_0_8px_var(--color-primary-glow)]' : ''} />
          <span className="text-[10px] tracking-wide">Budjet</span>
          {activeTab === 'budget' && (
            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full animate-ping"></span>
          )}
        </button>

        {/* Debts */}
        <button
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-300 relative ${
            activeTab === 'debts' 
              ? 'text-brand-primary scale-110 font-bold' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <BookOpen size={20} className={activeTab === 'debts' ? 'drop-shadow-[0_0_8px_var(--color-primary-glow)]' : ''} />
          <span className="text-[10px] tracking-wide">Qarzlar</span>
          {activeTab === 'debts' && (
            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full animate-ping"></span>
          )}
        </button>

        {/* AI Report */}
        <button
          onClick={() => setActiveTab('ai_report')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-300 relative ${
            activeTab === 'ai_report' 
              ? 'text-brand-primary scale-110 font-bold' 
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Sparkles size={20} className={activeTab === 'ai_report' ? 'animate-pulse text-brand-primary drop-shadow-[0_0_10px_var(--color-primary-glow)]' : ''} />
          <span className="text-[10px] tracking-wide">AI Tahlil</span>
          {activeTab === 'ai_report' && (
            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full animate-ping"></span>
          )}
        </button>
      </div>
    </div>
  );
}
