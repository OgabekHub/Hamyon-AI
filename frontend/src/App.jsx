import React, { useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Debts from './pages/Debts';
import AIReport from './pages/AIReport';
import { LayoutDashboard, History, Target, BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  const { user, loading, fetchWithAuth } = useTelegram();
  const [activeTab, setActiveTab] = useState('home'); // home, transactions, budget, debts, ai_report

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-brand-bg text-brand-text">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium animate-pulse text-brand-muted">Hamyon AI yuklanmoqda...</p>
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
    <div className="h-full flex flex-col justify-between max-w-md mx-auto relative bg-brand-bg shadow-lg">
      {/* Asosiy Kontent oqimi */}
      <div className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </div>

      {/* Premium Mobil Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-card/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex justify-between items-center max-w-md mx-auto shadow-2xl">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-brand-primary scale-110 font-bold' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'transactions' ? 'text-brand-primary scale-110 font-bold' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <History size={20} />
          <span className="text-[10px]">Xarajatlar</span>
        </button>

        {/* Budget */}
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'budget' ? 'text-brand-primary scale-110 font-bold' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Target size={20} />
          <span className="text-[10px]">Budjet</span>
        </button>

        {/* Debts */}
        <button
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'debts' ? 'text-brand-primary scale-110 font-bold' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px]">Qarzlar</span>
        </button>

        {/* AI Report */}
        <button
          onClick={() => setActiveTab('ai_report')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'ai_report' ? 'text-brand-primary scale-110 font-bold' : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Sparkles size={20} className={activeTab === 'ai_report' ? 'animate-pulse' : ''} />
          <span className="text-[10px]">AI Tahlil</span>
        </button>
      </div>
    </div>
  );
}
