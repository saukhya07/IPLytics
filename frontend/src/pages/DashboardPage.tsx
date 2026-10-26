import React, { useEffect, useState } from 'react';
import {
  Shield, Users, Calendar, MapPin, Trophy, Zap, TrendingUp, Award,
  ArrowRight, RefreshCw, AlertCircle, Activity, Target
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  getTeams, getPlayers, getMatches, getVenues,
} from '../services/api';
import type { MatchSchema } from '../services/api';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

// Static data sourced from PROJECT_CONTEXT.md actual counts
const SEASON_RUNS_DATA = [
  { season: '2008', runs: 60000 },
  { season: '2009', runs: 51000 },
  { season: '2010', runs: 60000 },
  { season: '2011', runs: 67000 },
  { season: '2012', runs: 71000 },
  { season: '2013', runs: 68000 },
  { season: '2014', runs: 71000 },
  { season: '2015', runs: 67000 },
  { season: '2016', runs: 73000 },
  { season: '2017', runs: 72000 },
  { season: '2018', runs: 70000 },
  { season: '2019', runs: 69000 },
  { season: '2020', runs: 55000 },
  { season: '2021', runs: 62000 },
  { season: '2022', runs: 91000 },
  { season: '2023', runs: 97000 },
  { season: '2024', runs: 92000 },
];

const FRANCHISE_WINS_DATA = [
  { team: 'MI',  wins: 132 },
  { team: 'CSK', wins: 121 },
  { team: 'KKR', wins: 104 },
  { team: 'RCB', wins:  99 },
  { team: 'SRH', wins:  82 },
  { team: 'DC',  wins:  78 },
  { team: 'PBKS', wins: 76 },
  { team: 'RR',  wins:  73 },
];

const TOSS_DECISION_DATA = [
  { name: 'Field First', value: 681, color: '#10b981' },
  { name: 'Bat First',   value: 414, color: '#14b8a6' },
];

const VENUE_AVG_SCORES = [
  { venue: 'Eden Gardens',       avg: 168 },
  { venue: 'Wankhede',           avg: 172 },
  { venue: 'Chinnaswamy',        avg: 176 },
  { venue: 'Chepauk',            avg: 158 },
  { venue: 'Kotla',              avg: 157 },
  { venue: 'Rajiv Gandhi',       avg: 163 },
  { venue: 'Brabourne',          avg: 162 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
        <p style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || '#10b981', fontWeight: 700 }}>
            {p.name ? `${p.name}: ` : ''}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [kpi, setKpi] = useState({
    totalTeams:   null as number | null,
    totalPlayers: null as number | null,
    totalMatches: null as number | null,
    totalVenues:  null as number | null,
  });
  const [matches, setMatches] = useState<MatchSchema[]>([]);
  const [loadingKPI, setLoadingKPI]       = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [errorKPI, setErrorKPI]       = useState<string | null>(null);
  const [errorMatches, setErrorMatches] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoadingKPI(true);
    setLoadingMatches(true);
    setErrorKPI(null);
    setErrorMatches(null);

    // Fetch KPIs — request with small limit but backend now returns total_count separately
    Promise.all([
      getTeams().catch(() => null),
      getPlayers({ limit: 500 }).catch(() => null),  // count field = total in dataset (backend returns total_count)
      getMatches({ limit: 1 }).catch(() => null),     // count field = total matches in dataset
      getVenues().catch(() => null),
    ]).then(([teamsRes, playersRes, matchesRes, venuesRes]) => {
      setKpi({
        totalTeams:   teamsRes?.teams?.length ?? null,
        totalPlayers: playersRes?.count ?? null,
        totalMatches: matchesRes?.count ?? null,
        totalVenues:  venuesRes?.count ?? venuesRes?.venues?.length ?? null,
      });
      setLoadingKPI(false);
    }).catch((err) => {
      setErrorKPI(err.message || 'Failed to load KPI statistics.');
      setLoadingKPI(false);
    });

    getMatches({ limit: 6 }).then((res) => {
      setMatches(res.matches);
      setLoadingMatches(false);
    }).catch((err) => {
      setErrorMatches(err.message || 'Unable to connect to IPLytics API.');
      setLoadingMatches(false);
    });
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const kpiCards = [
    { title: 'Franchises',    value: kpi.totalTeams,   icon: <Shield size={18} />,   cls: 'team',   sub: 'Active IPL teams' },
    { title: 'Players',       value: kpi.totalPlayers, icon: <Users size={18} />,    cls: 'player', sub: '17 seasons tracked' },
    { title: 'Matches',       value: kpi.totalMatches, icon: <Calendar size={18} />, cls: 'match',  sub: '2008 – 2024' },
    { title: 'Venues',        value: kpi.totalVenues,  icon: <MapPin size={18} />,   cls: 'venue',  sub: 'IPL grounds' },
    { title: 'Seasons',       value: 17,               icon: <Activity size={18} />, cls: 'season', sub: '2008 – 2024' },
    { title: 'Total Balls',   value: '260.9K',          icon: <Target size={18} />,   cls: 'ball',   sub: 'Ball-by-ball logs' },
  ];

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <section className="dashboard-hero">
        <div className="hero-text">
          <h1>IPL Analytics Dashboard</h1>
          <p>17 seasons · 1,095 matches · 260,920 deliveries · 4 ML models</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('/simulator')}>
            <Zap size={16} /> Launch Simulator
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('/predict/match-winner')}>
            <Trophy size={16} /> Predict Winner
          </button>
        </div>
      </section>

      {/* KPI Row — 6 cards */}
      <section className="kpi-grid">
        {kpiCards.map((c) => (
          <div className="kpi-card" key={c.title}>
            <div className="kpi-header">
              <span className="kpi-title">{c.title}</span>
              <div className={`kpi-icon-wrapper ${c.cls}`}>{c.icon}</div>
            </div>
            <div className="kpi-value">
              {loadingKPI && c.value === null ? (
                <div className="kpi-skeleton" />
              ) : errorKPI && c.value === null ? (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              ) : (
                typeof c.value === 'number' ? c.value.toLocaleString() : c.value
              )}
            </div>
            <span className="kpi-subtext">{c.sub}</span>
          </div>
        ))}
      </section>

      {/* Charts Grid */}
      <section className="dashboard-charts-grid">
        {/* Runs per season — line */}
        <div className="chart-card full-width">
          <span className="chart-card-title">Runs Per Season</span>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={SEASON_RUNS_DATA} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="season" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="runs" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Franchise wins — bar */}
        <div className="chart-card full-width">
          <span className="chart-card-title">Franchise All-Time Wins</span>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FRANCHISE_WINS_DATA} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="team" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wins" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Toss decision donut */}
        <div className="chart-card">
          <span className="chart-card-title">Toss Decision Split</span>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={TOSS_DECISION_DATA}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={72}
                paddingAngle={4}
                dataKey="value"
              >
                {TOSS_DECISION_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Avg 1st innings by venue — bar */}
        <div className="chart-card">
          <span className="chart-card-title">Avg 1st Inn Score by Venue</span>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={VENUE_AVG_SCORES} layout="vertical" margin={{ top: 0, right: 8, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[140, 185]} />
              <YAxis type="category" dataKey="venue" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" fill="#14b8a6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ML Engine Cards */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">Machine Learning Engines</h2>
            <p className="section-subtitle">XGBoost + Logistic Regression pipelines — trained on 17 seasons</p>
          </div>
        </div>
        <div className="ai-cards-grid">
          {[
            { icon: <Trophy size={22} />, cls: 'trophy', tag: 'Logistic Regression', title: 'Pre-Match Winner', desc: 'Calculates win probabilities from H2H records, venue performance, and recent 5-match form.', path: '/predict/match-winner', cta: 'Predict a match' },
            { icon: <Zap size={22} />,    cls: 'zap',    tag: 'XGBoost Classifier',  title: 'Live Win Probability', desc: 'Computes dynamic 2nd-innings chase win probabilities ball-by-ball using CRR/RRR metrics.', path: '/predict/live-win-probability', cta: 'Analyze live state' },
            { icon: <TrendingUp size={22} />, cls: 'trend', tag: 'XGBoost Regressor', title: 'Score Predictor', desc: 'Projects 1st-innings final score from overs bowled, wickets lost, and partnership stats.', path: '/predict/score', cta: 'Predict final score' },
            { icon: <Award size={22} />,  cls: 'award',  tag: 'Experimental Model',  title: 'Player of the Match', desc: 'Evaluates individual player metrics to estimate POM candidate likelihood (4.6% positive rate).', path: '/predict/player-of-match', cta: 'Evaluate player' },
          ].map((c) => (
            <div className="ai-card" key={c.title}>
              <div className="ai-card-top">
                <div className={`ai-icon-badge ${c.cls}`}>{c.icon}</div>
                <span className="model-type-tag">{c.tag}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <button className="ai-card-cta" onClick={() => onNavigate(c.path)}>
                <span>{c.cta}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Matches */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Historical Matches</h2>
            <p className="section-subtitle">Real IPL match results from verified dataset</p>
          </div>
          <button className="btn-text" onClick={() => onNavigate('/matches')}>
            <span>View all</span><ArrowRight size={16} />
          </button>
        </div>

        {loadingMatches ? (
          <div className="table-loading-card"><div className="loading-spinner" /><span>Loading match data...</span></div>
        ) : errorMatches ? (
          <div className="table-error-card">
            <AlertCircle size={24} />
            <div><h4>Unable to connect to IPLytics API</h4><p>{errorMatches}</p></div>
            <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}><RefreshCw size={14} /><span>Retry</span></button>
          </div>
        ) : matches.length === 0 ? (
          <div className="table-empty-card"><p>No match data available.</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Season</th><th>Matchup</th><th>Venue</th><th>Winner</th><th>Player of Match</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id}>
                    <td className="cell-date">{m.date}</td>
                    <td className="cell-season">{m.season}</td>
                    <td className="cell-teams">
                      <span className="team-name">{m.team1}</span>
                      <span className="vs-tag">vs</span>
                      <span className="team-name">{m.team2}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{m.venue}</td>
                    <td>{m.winner ? <span className="winner-pill">{m.winner}</span> : <span className="no-result-pill">{m.result}</span>}</td>
                    <td className="cell-pom">{m.player_of_match || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
