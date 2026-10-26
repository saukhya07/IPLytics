import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Shield,
  Users,
  GitCompare,
  PlayCircle,
  Trophy,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  X
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onCloseMobile,
}) => {
  const mainNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Matches', path: '/matches', icon: Calendar },
    { label: 'Teams', path: '/teams', icon: Shield },
    { label: 'Players', path: '/players', icon: Users },
    { label: 'Head-to-Head', path: '/head-to-head', icon: GitCompare },
    { label: 'Match Simulator', path: '/simulator', icon: PlayCircle },
  ];

  const aiNavItems = [
    { label: 'Match Prediction', path: '/predict/match-winner', icon: Trophy },
    { label: 'Live Win Probability', path: '/predict/live-win-probability', icon: Zap },
    { label: 'Score Prediction', path: '/predict/score', icon: TrendingUp },
    { label: 'Player of Match', path: '/predict/player-of-match', icon: Award },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Header Branding */}
        <div className="sidebar-header">
          <div className="brand" onClick={() => handleLinkClick('/')}>
            <div className="brand-logo">
              <Zap className="brand-icon" size={22} />
            </div>
            <div className="brand-text">
              <span className="brand-name">IPLytics</span>
              <span className="brand-badge">ML PLATFORM</span>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={onCloseMobile} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="sidebar-content">
          <div className="nav-group">
            <span className="nav-group-title">MAIN</span>
            <ul className="nav-list">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <li key={item.path}>
                    <button
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => handleLinkClick(item.path)}
                    >
                      <Icon className="nav-icon" size={18} />
                      <span className="nav-label">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="nav-group">
            <div className="nav-group-header">
              <span className="nav-group-title">AI INSIGHTS</span>
              <Sparkles className="sparkle-icon" size={12} />
            </div>
            <ul className="nav-list">
              {aiNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <li key={item.path}>
                    <button
                      className={`nav-link ai-link ${isActive ? 'active' : ''}`}
                      onClick={() => handleLinkClick(item.path)}
                    >
                      <Icon className="nav-icon ai-icon" size={18} />
                      <span className="nav-label">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="sidebar-footer">
          <div className="status-pill">
            <span className="status-dot" />
            <span className="status-label">FastAPI Backend Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
};
