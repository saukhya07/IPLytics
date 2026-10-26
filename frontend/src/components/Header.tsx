import React, { useState, useEffect } from 'react';
import { Menu, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getHealth } from '../services/api';
import type { HealthResponse } from '../services/api';

interface HeaderProps {
  currentPath: string;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onToggleMobileSidebar,
}) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealth(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  const getPageTitle = (path: string): string => {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/matches':
        return 'Historical Match Archive';
      case '/teams':
        return 'IPL Teams & Franchises';
      case '/players':
        return 'IPL Player Database';
      case '/head-to-head':
        return 'Head-to-Head Comparison';
      case '/simulator':
        return 'Historical Match Simulator';
      case '/predict/match-winner':
        return 'Pre-Match Winner Prediction';
      case '/predict/live-win-probability':
        return 'Live Win Probability Engine';
      case '/predict/score':
        return 'Innings Final Score Predictor';
      case '/predict/player-of-match':
        return 'Player of the Match Candidate Predictor';
      default:
        return 'IPLytics Analytics';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="header-title-container">
          <h2 className="header-title">{getPageTitle(currentPath)}</h2>
          <span className="header-breadcrumb">IPLytics / {currentPath === '/' ? 'Dashboard' : currentPath.slice(1)}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="system-health-badge">
          {error ? (
            <div className="health-status error">
              <AlertTriangle size={15} />
              <span>Backend Offline</span>
            </div>
          ) : health?.models_loaded ? (
            <div className="health-status healthy">
              <ShieldCheck size={15} />
              <span>ML Engine Active</span>
            </div>
          ) : (
            <div className="health-status loading">
              <Activity size={15} className="spin" />
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
