import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { MatchesPage } from './pages/MatchesPage';
import { TeamsPage } from './pages/TeamsPage';
import { PlayersPage } from './pages/PlayersPage';
import { HeadToHeadPage } from './pages/HeadToHeadPage';
import { MatchWinnerPage } from './pages/MatchWinnerPage';
import { LiveWinProbabilityPage } from './pages/LiveWinProbabilityPage';
import { ScorePredictionPage } from './pages/ScorePredictionPage';
import { PlayerOfMatchPage } from './pages/PlayerOfMatchPage';
import { SimulatorPage } from './pages/SimulatorPage';
import './App.css';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/':
      case '/dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case '/matches':
        return <MatchesPage onNavigate={handleNavigate} />;

      case '/teams':
        return <TeamsPage />;

      case '/players':
        return <PlayersPage />;

      case '/head-to-head':
        return <HeadToHeadPage />;

      case '/simulator':
        return <SimulatorPage />;

      case '/predict/match-winner':
        return <MatchWinnerPage />;

      case '/predict/live-win-probability':
        return <LiveWinProbabilityPage />;

      case '/predict/score':
        return <ScorePredictionPage />;

      case '/predict/player-of-match':
        return <PlayerOfMatchPage />;

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="app-main-wrapper">
        <Header
          currentPath={currentPath}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="app-body">{renderCurrentPage()}</main>
      </div>
    </div>
  );
}

export default App;
