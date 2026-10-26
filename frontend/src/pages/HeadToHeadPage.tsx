import React, { useEffect, useState, useCallback } from 'react';
import {
  GitCompare, Shield, ArrowLeftRight, AlertCircle, RefreshCw, Info
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getTeams, getHeadToHead } from '../services/api';
import type { HeadToHeadResponse, RecentMeeting } from '../services/api';

const COLORS = { a: '#10b981', b: '#14b8a6', tie: '#64748b', nr: '#334155' };

const H2hTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
        <p style={{ color: payload[0].payload.color || '#10b981', fontWeight: 700 }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const HeadToHeadPage: React.FC = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [team1, setTeam1] = useState<string>('');
  const [team2, setTeam2] = useState<string>('');
  const [h2hData, setH2hData] = useState<HeadToHeadResponse | null>(null);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [loadingH2H, setLoadingH2H] = useState<boolean>(false);
  const [errorTeams, setErrorTeams] = useState<string | null>(null);
  const [errorH2H, setErrorH2H] = useState<string | null>(null);

  const fetchH2HData = useCallback((t1: string, t2: string) => {
    if (!t1 || !t2 || t1 === t2) return;
    setLoadingH2H(true);
    setErrorH2H(null);
    getHeadToHead(t1, t2)
      .then((data) => { setH2hData(data); setLoadingH2H(false); })
      .catch((err) => { setErrorH2H(err.message || `Unable to load H2H stats for ${t1} vs ${t2}.`); setLoadingH2H(false); });
  }, []);

  const fetchTeams = () => {
    setLoadingTeams(true);
    setErrorTeams(null);
    getTeams()
      .then((res) => {
        setTeams(res.teams);
        setLoadingTeams(false);
        if (res.teams.length >= 2) {
          const defaultT1 = res.teams.find((t) => t.includes('Mumbai')) || res.teams[0];
          const defaultT2 = res.teams.find((t) => t.includes('Chennai')) || res.teams[1];
          setTeam1(defaultT1);
          setTeam2(defaultT2);
          fetchH2HData(defaultT1, defaultT2);
        }
      })
      .catch((err) => { setErrorTeams(err.message || 'Failed to load IPL teams list.'); setLoadingTeams(false); });
  };

  useEffect(() => { fetchTeams(); }, [fetchH2HData]);

  const handleTeam1Change = (newT1: string) => {
    setTeam1(newT1);
    if (newT1 && team2 && newT1 !== team2) fetchH2HData(newT1, team2);
  };
  const handleTeam2Change = (newT2: string) => {
    setTeam2(newT2);
    if (team1 && newT2 && team1 !== newT2) fetchH2HData(team1, newT2);
  };
  const handleSwapTeams = () => {
    if (!team1 || !team2 || team1 === team2) return;
    setTeam1(team2);
    setTeam2(team1);
    fetchH2HData(team2, team1);
  };

  const getTeamInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase();

  const isSameTeam = team1 !== '' && team2 !== '' && team1 === team2;

  // Donut data
  const donutData = h2hData
    ? [
        { name: h2hData.team1, value: h2hData.team1_wins, color: COLORS.a },
        { name: h2hData.team2, value: h2hData.team2_wins, color: COLORS.b },
        ...(h2hData.ties > 0 ? [{ name: 'Ties', value: h2hData.ties, color: COLORS.tie }] : []),
        ...(h2hData.no_result > 0 ? [{ name: 'No Result', value: h2hData.no_result, color: COLORS.nr }] : []),
      ]
    : [];

  const formatMargin = (meeting: RecentMeeting) => {
    if (!meeting.winner) return '—';
    if (meeting.result === 'tie') return 'Tie';
    if (meeting.result === 'no result') return 'N/R';
    if (meeting.result_margin == null) return meeting.result || '—';
    if (meeting.result.includes('run')) return `${meeting.result_margin} runs`;
    if (meeting.result.includes('wkt') || meeting.result.includes('wicket')) return `${meeting.result_margin} wkts`;
    return `${meeting.result_margin}`;
  };

  return (
    <div className="h2h-page-container">
      {/* Header */}
      <section className="page-header">
        <div>
          <h1>Head-to-Head Comparison</h1>
          <p>Compare historical IPL rivalry records, total wins, and win percentages between any two franchises.</p>
        </div>
      </section>

      {/* Team Selection */}
      <section className="h2h-selector-card">
        {loadingTeams ? (
          <div className="h2h-selector-skeleton">
            <div className="select-skeleton" />
            <div className="swap-skeleton" />
            <div className="select-skeleton" />
          </div>
        ) : errorTeams ? (
          <div className="state-card error">
            <AlertCircle size={20} /><span>{errorTeams}</span>
            <button className="btn btn-secondary btn-sm" onClick={fetchTeams}><RefreshCw size={14} /><span>Retry</span></button>
          </div>
        ) : (
          <div className="h2h-selector-controls">
            <div className="team-select-group">
              <label htmlFor="team1-select">TEAM A</label>
              <select id="team1-select" className="custom-select" value={team1} onChange={(e) => handleTeam1Change(e.target.value)}>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="swap-action-container" style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="btn-swap" onClick={handleSwapTeams} disabled={isSameTeam || !team1 || !team2} title="Swap Teams" aria-label="Swap Team A and Team B">
                <ArrowLeftRight size={18} />
              </button>
            </div>
            <div className="team-select-group">
              <label htmlFor="team2-select">TEAM B</label>
              <select id="team2-select" className="custom-select" value={team2} onChange={(e) => handleTeam2Change(e.target.value)}>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
        {isSameTeam && (
          <div className="same-team-warning">
            <Info size={16} /><span>Please select two different IPL teams for Head-to-Head comparison.</span>
          </div>
        )}
      </section>

      {/* Main Results */}
      <section>
        {!team1 || !team2 || isSameTeam ? (
          <div className="state-card empty">
            <GitCompare size={32} /><h4>Select Two Franchises</h4>
            <p>Choose two different teams above to calculate head-to-head match statistics.</p>
          </div>
        ) : loadingH2H ? (
          <div className="h2h-loading-card"><div className="loading-spinner" /><span>Calculating H2H metrics for {team1} vs {team2}...</span></div>
        ) : errorH2H ? (
          <div className="state-card error">
            <AlertCircle size={24} />
            <div><h4>Unable to load head-to-head data</h4><p>{errorH2H}</p></div>
            <button className="btn btn-secondary btn-sm" onClick={() => fetchH2HData(team1, team2)}><RefreshCw size={14} /><span>Retry</span></button>
          </div>
        ) : h2hData ? (
          <div className="h2h-results-wrapper">

            {/* Hero Banner */}
            <div className="rivalry-hero-card">
              <div className="rivalry-team team-a">
                <div className="team-crest"><Shield size={28} /><span>{getTeamInitials(h2hData.team1)}</span></div>
                <h3>{h2hData.team1}</h3>
                <div className="hero-win-stat">{h2hData.team1_wins} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Wins</span></div>
              </div>
              <div className="rivalry-vs-badge">
                <span className="vs-circle">VS</span>
                <span className="total-matches-label">{h2hData.total_matches} Matches</span>
              </div>
              <div className="rivalry-team team-b">
                <div className="team-crest teal"><Shield size={28} /><span>{getTeamInitials(h2hData.team2)}</span></div>
                <h3>{h2hData.team2}</h3>
                <div className="hero-win-stat teal-stat">{h2hData.team2_wins} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Wins</span></div>
              </div>
            </div>

            {/* Donut + Stat Cards side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', alignItems: 'start' }}>
              {/* Win Split Donut */}
              <div className="chart-card" style={{ minHeight: 240 }}>
                <span className="chart-card-title">Win Split</span>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<H2hTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 5-Col Stat Grid */}
              <div className="h2h-summary-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="h2h-stat-card">
                  <span className="h2h-stat-title">Total Matches</span>
                  <span className="h2h-stat-value">{h2hData.total_matches}</span>
                  <span className="h2h-stat-sub">Official fixtures</span>
                </div>
                <div className="h2h-stat-card">
                  <span className="h2h-stat-title">{h2hData.team1} Wins</span>
                  <span className="h2h-stat-value text-emerald">{h2hData.team1_wins}</span>
                  <span className="h2h-stat-sub">{h2hData.team1_win_percentage.toFixed(1)}% win rate</span>
                </div>
                <div className="h2h-stat-card">
                  <span className="h2h-stat-title">{h2hData.team2} Wins</span>
                  <span className="h2h-stat-value text-teal">{h2hData.team2_wins}</span>
                  <span className="h2h-stat-sub">{h2hData.team2_win_percentage.toFixed(1)}% win rate</span>
                </div>
                <div className="h2h-stat-card">
                  <span className="h2h-stat-title">Ties</span>
                  <span className="h2h-stat-value">{h2hData.ties}</span>
                  <span className="h2h-stat-sub">Super Over decided</span>
                </div>
                <div className="h2h-stat-card" title="No Result = match abandoned, no winner declared">
                  <span className="h2h-stat-title">No Results ⓘ</span>
                  <span className="h2h-stat-value">{h2hData.no_result}</span>
                  <span className="h2h-stat-sub">Abandoned matches</span>
                </div>
              </div>
            </div>

            {/* Win Rate Bar */}
            <div className="win-bar-card">
              <div className="win-bar-header">
                <span className="bar-team-name team-a-text">
                  {h2hData.team1} ({h2hData.team1_win_percentage.toFixed(1)}%)
                </span>
                <span className="bar-title">Head-to-Head Win Rate</span>
                <span className="bar-team-name team-b-text">
                  {h2hData.team2} ({h2hData.team2_win_percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="win-comparison-bar-track">
                <div className="bar-segment team-a-segment" style={{ width: `${Math.max(5, h2hData.team1_win_percentage)}%` }} />
                <div className="bar-segment team-b-segment" style={{ width: `${Math.max(5, h2hData.team2_win_percentage)}%` }} />
              </div>
            </div>

            {/* Last 5 Meetings Table */}
            {h2hData.recent_meetings && h2hData.recent_meetings.length > 0 && (
              <div className="table-container">
                <div style={{ padding: '1rem 1.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>Last {h2hData.recent_meetings.length} Meetings</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Winner</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h2hData.recent_meetings.map((m, i) => (
                      <tr key={i}>
                        <td className="cell-date">{m.date}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{m.venue}</td>
                        <td>
                          {m.winner ? (
                            <span className={`winner-pill ${m.winner === h2hData.team1 ? '' : 'teal-pill'}`}>{m.winner}</span>
                          ) : (
                            <span className="no-result-pill" title="No Result = match abandoned, no winner declared">No Result</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{formatMargin(m)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
};
