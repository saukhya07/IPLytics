import React, { useEffect, useState } from 'react';
import {
  Shield,
  Trophy,
  Activity,
  AlertCircle,
  RefreshCw,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getTeams, getTeam } from '../services/api';
import type { TeamStats } from '../services/api';

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamStats | null>(null);

  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const [errorTeams, setErrorTeams] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchTeams = () => {
    setLoadingTeams(true);
    setErrorTeams(null);
    getTeams()
      .then((res) => {
        setTeams(res.teams);
        setLoadingTeams(false);
        if (res.teams.length > 0) {
          fetchTeamDetails(res.teams[0]);
        }
      })
      .catch((err) => {
        setErrorTeams(err.message || 'Failed to load IPL teams.');
        setLoadingTeams(false);
      });
  };

  const fetchTeamDetails = (teamName: string) => {
    setSelectedTeamName(teamName);
    setLoadingDetails(true);
    setErrorDetails(null);
    getTeam(teamName)
      .then((data) => {
        setTeamDetails(data);
        setLoadingDetails(false);
      })
      .catch((err) => {
        setErrorDetails(err.message || `Unable to load details for ${teamName}.`);
        setLoadingDetails(false);
      });
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Helper to extract clean team acronym
  const getTeamInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="teams-page-container">
      {/* Page Header */}
      <section className="page-header">
        <div>
          <h1>IPL Teams & Franchises</h1>
          <p>Explore franchise performance, overall win rates, and historical scoring records.</p>
        </div>
      </section>

      {/* Team Selector Grid */}
      <section className="teams-selector-section">
        <h3 className="section-label">Select Franchise</h3>
        {loadingTeams ? (
          <div className="teams-selector-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="team-pill-skeleton" />
            ))}
          </div>
        ) : errorTeams ? (
          <div className="state-card error">
            <AlertCircle size={20} />
            <span>{errorTeams}</span>
            <button className="btn btn-secondary btn-sm" onClick={fetchTeams}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="teams-selector-grid">
            {teams.map((teamName) => {
              const isSelected = selectedTeamName === teamName;
              return (
                <button
                  key={teamName}
                  className={`team-select-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => fetchTeamDetails(teamName)}
                >
                  <span className="team-pill-icon">{getTeamInitials(teamName)}</span>
                  <span className="team-pill-name">{teamName}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Team Details Section */}
      <section className="team-details-section">
        {loadingDetails ? (
          <div className="details-loading-card">
            <div className="loading-spinner" />
            <span>Fetching team performance statistics...</span>
          </div>
        ) : errorDetails ? (
          <div className="state-card error">
            <AlertCircle size={24} />
            <div>
              <h4>Unable to load team statistics</h4>
              <p>{errorDetails}</p>
            </div>
            {selectedTeamName && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fetchTeamDetails(selectedTeamName)}
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : teamDetails ? (
          <div className="team-dashboard-view">
            {/* Team Hero Card */}
            <div className="team-hero-card">
              <div className="hero-left">
                <div className="team-avatar-crest">
                  <Shield size={36} className="crest-icon" />
                  <span className="crest-code">{getTeamInitials(teamDetails.team)}</span>
                </div>
                <div className="hero-info">
                  <h2>{teamDetails.team}</h2>
                  <span className="hero-subtitle">Official IPL Franchise Performance</span>
                </div>
              </div>

              <div className="hero-right">
                <div className="win-rate-stat">
                  <div className="win-rate-value">{teamDetails.win_percentage.toFixed(1)}%</div>
                  <span className="win-rate-label">Historical Win Rate</span>
                </div>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="team-stats-grid">
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Matches Played</span>
                  <div className="stat-icon matches"><Activity size={18} /></div>
                </div>
                <div className="stat-card-value">{teamDetails.matches}</div>
                <span className="stat-card-sub">Total official IPL fixtures</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Wins</span>
                  <div className="stat-icon wins"><CheckCircle2 size={18} /></div>
                </div>
                <div className="stat-card-value text-emerald">{teamDetails.wins}</div>
                <span className="stat-card-sub">Victorious matches</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Losses</span>
                  <div className="stat-icon losses"><XCircle size={18} /></div>
                </div>
                <div className="stat-card-value text-red">{teamDetails.losses}</div>
                <span className="stat-card-sub">Defeats suffered</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Win %</span>
                  <div className="stat-icon percent"><Percent size={18} /></div>
                </div>
                <div className="stat-card-value">{teamDetails.win_percentage.toFixed(1)}%</div>
                <span className="stat-card-sub">Overall win percentage</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Average Score</span>
                  <div className="stat-icon avg"><TrendingUp size={18} /></div>
                </div>
                <div className="stat-card-value">{teamDetails.average_score.toFixed(1)}</div>
                <span className="stat-card-sub">Runs per innings</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Highest Score</span>
                  <div className="stat-icon high"><Trophy size={18} /></div>
                </div>
                <div className="stat-card-value text-gold">{teamDetails.highest_score}</div>
                <span className="stat-card-sub">Franchise record innings total</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Lowest Score</span>
                  <div className="stat-icon low"><Award size={18} /></div>
                </div>
                <div className="stat-card-value">{teamDetails.lowest_score}</div>
                <span className="stat-card-sub">Lowest innings score</span>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Ties / No Results</span>
                  <div className="stat-icon ties"><Shield size={18} /></div>
                </div>
                <div className="stat-card-value">
                  {teamDetails.ties} <span className="stat-card-sub-inline">/ {teamDetails.no_results}</span>
                </div>
                <span className="stat-card-sub">Tied fixtures & abandoned games</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
