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
  const { user, loading: tgLoading, fetchWithAuth } = useTelegram();
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Global States
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [debts, setDebts] = useState([]);
  const [insight, setInsight] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Parallel Loader
  const loadAllData = async () => {
    try {
      setDataLoading(true);
      const [profileData, txsData, budgetsData, debtsData, insightData] = await Promise.all([
        fetchWithAuth('/api/auth').catch(err => {
          console.warn("Auth fetch failed:", err);
          return { id: 'dev-user-uuid-1234', telegram_id: user?.id || 123456789, name: user?.name || 'Jasur', monthly_budget: 5000000, currency: 'UZS' };
        }),
        fetchWithAuth('/api/transactions').catch(err => {
          console.warn("Transactions fetch failed:", err);
          return [];
        }),
        fetchWithAuth('/api/budgets').catch(err => {
          console.warn("Budgets fetch failed:", err);
          return [];
        }),
        fetchWithAuth('/api/debts').catch(err => {
          console.warn("Debts fetch failed:", err);
          return [];
        }),
        fetchWithAuth('/api/insights').catch(err => {
          console.warn("Insights fetch failed:", err);
          return null;
        }),
      ]);
      setProfile(profileData);
      setTransactions(txsData);
      setBudgets(budgetsData);
      setDebts(debtsData);
      setInsight(insightData);
    } catch (err) {
      console.error("Critical error loading app data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Refresh functions for mutations
  const refreshTransactions = async () => {
    try {
      const data = await fetchWithAuth('/api/transactions');
      setTransactions(data);
    } catch (err) {
      console.error("Failed to refresh transactions:", err);
    }
  };

  const refreshProfile = async () => {
    try {
      const data = await fetchWithAuth('/api/auth');
      setProfile(data);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const refreshBudgets = async () => {
    try {
      const data = await fetchWithAuth('/api/budgets');
      setBudgets(data);
    } catch (err) {
      console.error("Failed to refresh budgets:", err);
    }
  };

  const refreshDebts = async () => {
    try {
      const data = await fetchWithAuth('/api/debts');
      setDebts(data);
    } catch (err) {
      console.error("Failed to refresh debts:", err);
    }
  };

  const refreshInsight = async () => {
    try {
      const data = await fetchWithAuth('/api/insights');
      setInsight(data);
    } catch (err) {
      console.error("Failed to refresh insight:", err);
    }
  };

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

  if (tgLoading || dataLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 20% 0%, #0d1630 0%, #040810 100%)' }}>
        {/* Animated logo/spinner */}
        <div className="relative mb-6">
          <img src={logoImg} alt="Hamyon AI Logo" className="h-16 w-auto object-contain animate-float" />
        </div>
        <div className="text-sm font-black tracking-widest uppercase flex items-center gap-0.5"
          style={{ color: '#ffffff' }}>
          H
          <span style={{ color: '#3b9ef8' }}>Λ</span>
          M
          Y
          <span className="relative inline-flex items-center justify-center">
            O
            <span className="absolute rounded-full" 
              style={{ 
                width: '3.5px', 
                height: '3.5px', 
                backgroundColor: '#3b9ef8', 
                boxShadow: '0 0 4px #3b9ef8' 
              }} 
            />
          </span>
          N
          <span className="ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-white" 
            style={{ 
              background: 'linear-gradient(135deg, #1e63f5, #3b9ef8)',
              letterSpacing: '0.5px'
            }}>
            AI
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: '#7fa8d4' }}>yuklanmoqda...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            fetchWithAuth={fetchWithAuth}
            user={user}
            setActiveTab={setActiveTab}
            transactions={transactions}
            userData={profile}
            refreshTransactions={refreshTransactions}
            refreshProfile={refreshProfile}
          />
        );
      case 'transactions':
        return (
          <Transactions
            fetchWithAuth={fetchWithAuth}
            transactions={transactions}
            refreshTransactions={refreshTransactions}
          />
        );
      case 'budget':
        return (
          <Budget
            fetchWithAuth={fetchWithAuth}
            budgets={budgets}
            transactions={transactions}
            refreshBudgets={refreshBudgets}
          />
        );
      case 'debts':
        return (
          <Debts
            fetchWithAuth={fetchWithAuth}
            debts={debts}
            refreshDebts={refreshDebts}
          />
        );
      case 'ai_report':
        return (
          <AIReport
            fetchWithAuth={fetchWithAuth}
            insight={insight}
            refreshInsight={refreshInsight}
          />
        );
      default:
        return (
          <Dashboard
            fetchWithAuth={fetchWithAuth}
            user={user}
            setActiveTab={setActiveTab}
            transactions={transactions}
            userData={profile}
            refreshTransactions={refreshTransactions}
            refreshProfile={refreshProfile}
          />
        );
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
          <span className="text-sm font-black tracking-widest uppercase flex items-center gap-0.5"
            style={{ color: 'var(--color-text)' }}>
            H
            <span style={{ color: 'var(--color-primary)' }}>Λ</span>
            M
            Y
            <span className="relative inline-flex items-center justify-center">
              O
              <span className="absolute rounded-full" 
                style={{ 
                  width: '3.5px', 
                  height: '3.5px', 
                  backgroundColor: 'var(--color-primary)', 
                  boxShadow: '0 0 4px var(--color-primary)' 
                }} 
              />
            </span>
            N
            <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-md text-white" 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-alt))',
                fontSize: '9px',
                letterSpacing: '0.5px'
              }}>
              AI
            </span>
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
