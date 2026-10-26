import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Sparkles, AlertCircle, RefreshCw, CheckCircle2, Activity } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Legend
} from 'recharts';
import {
  getTeams, getVenues, getHeadToHead, getTeam, getVenue, getMatches, predictMatchWinner
} from '../services/api';
import type { MatchWinnerResponse, MatchWinnerRequest } from '../services/api';

const ChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color || '#10b981', fontWeight: 700 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) + '%' : p.value}</p>)}
      </div>
    );
  }
  return null;
};

export const MatchWinnerPage: React.FC = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [venues, setVenues] = useState<{ venue: string }[]>([]);

  const [team1, setTeam1] = useState<string>('');
  const [team2, setTeam2] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'field'>('field');

  const [team1WinRate, setTeam1WinRate] = useState<number>(0);
  const [team2WinRate, setTeam2WinRate] = useState<number>(0);
  const [team1Form, setTeam1Form] = useState<number>(0);
  const [team2Form, setTeam2Form] = useState<number>(0);
  const [h2hWins1, setH2hWins1] = useState<number>(0);
  const [h2hWins2, setH2hWins2] = useState<number>(0);
  const [h2hTotal, setH2hTotal] = useState<number>(0);
  const [h2hWinRate1, setH2hWinRate1] = useState<number>(0);
  const [team1VenueWinRate, setTeam1VenueWinRate] = useState<number>(0);
  const [team2VenueWinRate, setTeam2VenueWinRate] = useState<number>(0);
  const [venueAvgScore, setVenueAvgScore] = useState<number>(0);

  const [prediction, setPrediction] = useState<MatchWinnerResponse | null>(null);
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [loadingPredict, setLoadingPredict] = useState<boolean>(false);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [errorPredict, setErrorPredict] = useState<string | null>(null);

  const fetchDerivedStats = useCallback((t1: string, t2: string, selectedVenue: string) => {
    if (!t1 || !t2 || t1 === t2) return;
    setLoadingStats(true);

    Promise.all([
      getTeam(t1).catch(() => null),
      getTeam(t2).catch(() => null),
      getHeadToHead(t1, t2).catch(() => null),
      getMatches({ team: t1, limit: 5 }).catch(() => null),
      getMatches({ team: t2, limit: 5 }).catch(() => null),
      selectedVenue ? getMatches({ team: t1, venue: selectedVenue, limit: 200 }).catch(() => null) : null,
      selectedVenue ? getMatches({ team: t2, venue: selectedVenue, limit: 200 }).catch(() => null) : null,
    ]).then(([t1Data, t2Data, h2hData, form1Data, form2Data, v1Data, v2Data]) => {
      setTeam1WinRate(t1Data ? t1Data.win_percentage / 100 : 0);
      setTeam2WinRate(t2Data ? t2Data.win_percentage / 100 : 0);

      if (h2hData && h2hData.total_matches > 0) {
        setH2hWins1(h2hData.team1_wins); setH2hWins2(h2hData.team2_wins);
        setH2hTotal(h2hData.total_matches); setH2hWinRate1(h2hData.team1_win_percentage / 100);
      } else { setH2hWins1(0); setH2hWins2(0); setH2hTotal(0); setH2hWinRate1(0); }

      if (form1Data && form1Data.matches.length > 0) {
        setTeam1Form(form1Data.matches.filter((m) => m.winner === t1).length / form1Data.matches.length);
      } else setTeam1Form(0);
      if (form2Data && form2Data.matches.length > 0) {
        setTeam2Form(form2Data.matches.filter((m) => m.winner === t2).length / form2Data.matches.length);
      } else setTeam2Form(0);

      if (v1Data && v1Data.matches.length > 0) setTeam1VenueWinRate(v1Data.matches.filter((m) => m.winner === t1).length / v1Data.matches.length);
      else setTeam1VenueWinRate(0);
      if (v2Data && v2Data.matches.length > 0) setTeam2VenueWinRate(v2Data.matches.filter((m) => m.winner === t2).length / v2Data.matches.length);
      else setTeam2VenueWinRate(0);
      setLoadingStats(false);
    });
  }, []);

  const fetchVenueStats = (vName: string, t1: string, t2: string) => {
    Promise.all([
      getVenue(vName).catch(() => null),
      getMatches({ venue: vName, limit: 1 }).catch(() => null),
    ]).then(([vData, vMatches]) => {
      if (vData) setVenueAvgScore(vData.average_first_innings_score); else setVenueAvgScore(0);
      if (vMatches && vMatches.matches.length > 0 && vMatches.matches[0].city) setCity(vMatches.matches[0].city); else setCity('');
    });
    fetchDerivedStats(t1, t2, vName);
  };

  useEffect(() => {
    Promise.all([getTeams(), getVenues()])
      .then(([teamsRes, venuesRes]) => {
        setTeams(teamsRes.teams);
        const venueList = venuesRes.venues.map((v) => ({ venue: v.venue }));
        setVenues(venueList);
        if (teamsRes.teams.length >= 2 && venueList.length > 0) {
          const t1 = teamsRes.teams[0], t2 = teamsRes.teams[1], selVenue = venueList[0].venue;
          setTeam1(t1); setTeam2(t2); setTossWinner(t1); setVenue(selVenue);
          fetchVenueStats(selVenue, t1, t2);
        }
        setLoadingInit(false);
      })
      .catch((err) => { setErrorPredict(err.message || 'Failed to initialize.'); setLoadingInit(false); });
  }, []);

  const handleTeam1Change = (val: string) => { setTeam1(val); fetchDerivedStats(val, team2, venue); };
  const handleTeam2Change = (val: string) => { setTeam2(val); fetchDerivedStats(team1, val, venue); };
  const handleVenueChange = (val: string) => { setVenue(val); fetchVenueStats(val, team1, team2); };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (team1 === team2) { setErrorPredict('Please select two different teams.'); return; }
    setLoadingPredict(true);
    setErrorPredict(null);

    const payload: MatchWinnerRequest = {
      team1, team2, venue, city,
      toss_winner: tossWinner || team1, toss_decision: tossDecision,
      team1_historical_win_rate: Number(team1WinRate.toFixed(4)),
      team2_historical_win_rate: Number(team2WinRate.toFixed(4)),
      team1_recent_form_5: Number(team1Form.toFixed(4)),
      team2_recent_form_5: Number(team2Form.toFixed(4)),
      h2h_team1_wins: Number(h2hWins1), h2h_team2_wins: Number(h2hWins2),
      h2h_total_matches: Number(h2hTotal), h2h_team1_win_rate: Number(h2hWinRate1.toFixed(4)),
      team1_venue_win_rate: Number(team1VenueWinRate.toFixed(4)),
      team2_venue_win_rate: Number(team2VenueWinRate.toFixed(4)),
      venue_avg_first_innings_score_historical: Number(venueAvgScore.toFixed(1)),
    };

    predictMatchWinner(payload)
      .then((data) => { setPrediction(data); setLoadingPredict(false); })
      .catch((err) => { setErrorPredict(err.message || 'Failed to generate prediction.'); setLoadingPredict(false); });
  };

  const isSameTeam = team1 !== '' && team2 !== '' && team1 === team2;
  const prob1 = prediction?.probabilities[team1] ?? 0.5;
  const prob2 = prediction?.probabilities[team2] ?? 0.5;

  const donutData = prediction ? [
    { name: team1, value: prob1 * 100, color: '#10b981' },
    { name: team2, value: prob2 * 100, color: '#14b8a6' },
  ] : [];

  // Radar chart data — compare key metrics between the two teams
  const radarData = [
    { metric: 'Overall Win %', team1: team1WinRate * 100, team2: team2WinRate * 100 },
    { metric: 'Recent Form', team1: team1Form * 100, team2: team2Form * 100 },
    { metric: 'H2H Win %', team1: h2hWinRate1 * 100, team2: (1 - h2hWinRate1) * 100 },
    { metric: 'Venue Win %', team1: team1VenueWinRate * 100, team2: team2VenueWinRate * 100 },
  ];

  return (
    <div className="predict-page-container">
      <section className="predict-page-header">
        <div>
          <h1>Pre-Match Winner Predictor</h1>
          <p>Logistic Regression model predicting win probability from form, venue, and H2H records.</p>
        </div>
      </section>

      <div className="predict-wide-layout">
        <form className="predict-form-card" onSubmit={handlePredict}>
          <div className="card-header-badge"><Trophy size={18} /><span>Pre-Match Matchup Setup</span></div>

          {loadingInit ? (
            <div className="predict-loading-skeleton" />
          ) : (
            <div className="form-fields">
              <div className="form-row-4">
                <div className="form-group">
                  <label htmlFor="mw-team1">Team 1</label>
                  <select id="mw-team1" className="custom-select" value={team1} onChange={(e) => handleTeam1Change(e.target.value)}>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mw-team2">Team 2</label>
                  <select id="mw-team2" className="custom-select" value={team2} onChange={(e) => handleTeam2Change(e.target.value)}>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mw-venue">Venue</label>
                  <select id="mw-venue" className="custom-select" value={venue} onChange={(e) => handleVenueChange(e.target.value)}>
                    {venues.map((v) => <option key={v.venue} value={v.venue}>{v.venue}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mw-city">City</label>
                  <input id="mw-city" type="text" className="custom-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Match city" />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="mw-toss-winner">Toss Winner</label>
                  <select id="mw-toss-winner" className="custom-select" value={tossWinner} onChange={(e) => setTossWinner(e.target.value)}>
                    <option value={team1}>{team1}</option>
                    <option value={team2}>{team2}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mw-toss-decision">Toss Decision</label>
                  <select id="mw-toss-decision" className="custom-select" value={tossDecision} onChange={(e) => setTossDecision(e.target.value as 'bat' | 'field')}>
                    <option value="field">Field First</option>
                    <option value="bat">Bat First</option>
                  </select>
                </div>
              </div>

              {isSameTeam && <div className="same-team-warning"><AlertCircle size={16} /><span>Team 1 and Team 2 must be different franchises.</span></div>}

              {/* Historical features panel */}
              <div className="derived-metrics-panel">
                <div className="panel-header-row">
                  <span className="panel-title">Real Historical Features (Computed from Datasets)</span>
                  {loadingStats && <Activity size={14} className="spin text-teal" />}
                </div>
                <div className="metrics-grid">
                  <div className="metric-chip"><span className="chip-label">H2H Wins ({team1})</span><span className="chip-val">{h2hWins1} / {h2hTotal}</span></div>
                  <div className="metric-chip"><span className="chip-label">H2H Wins ({team2})</span><span className="chip-val">{h2hWins2} / {h2hTotal}</span></div>
                  <div className="metric-chip"><span className="chip-label">{team1} Recent Form</span><span className="chip-val">{(team1Form * 100).toFixed(0)}% (5m)</span></div>
                  <div className="metric-chip"><span className="chip-label">{team2} Recent Form</span><span className="chip-val">{(team2Form * 100).toFixed(0)}% (5m)</span></div>
                  <div className="metric-chip"><span className="chip-label">{team1} Venue Win %</span><span className="chip-val">{(team1VenueWinRate * 100).toFixed(1)}%</span></div>
                  <div className="metric-chip"><span className="chip-label">{team2} Venue Win %</span><span className="chip-val">{(team2VenueWinRate * 100).toFixed(1)}%</span></div>
                  <div className="metric-chip"><span className="chip-label">Venue Avg 1st Inn</span><span className="chip-val">{venueAvgScore.toFixed(0)} runs</span></div>
                  <div className="metric-chip"><span className="chip-label">{team1} Overall Win %</span><span className="chip-val">{(team1WinRate * 100).toFixed(1)}%</span></div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loadingPredict || isSameTeam}>
                {loadingPredict ? <><RefreshCw size={16} className="spin" /><span>Running Model...</span></> : <><Sparkles size={16} /><span>Predict Match Winner</span></>}
              </button>
            </div>
          )}
        </form>

        {/* Result Panel */}
        <div className="predict-result-card">
          {!prediction && !loadingPredict && !errorPredict && (
            <div className="state-card empty"><Trophy size={36} /><h4>Configure Match Parameters</h4><p>Select teams, venue and toss details to generate pre-match win probabilities.</p></div>
          )}
          {loadingPredict && <div className="table-loading-card"><div className="loading-spinner" /><span>Executing Logistic Regression prediction pipeline...</span></div>}
          {errorPredict && <div className="state-card error"><AlertCircle size={24} /><h4>Unable to generate prediction</h4><p>{errorPredict}</p></div>}

          {prediction && !loadingPredict && (
            <div className="prediction-display">
              <div className="model-badge"><CheckCircle2 size={15} /><span>Powered by Logistic Regression Model</span></div>

              {/* Winner hero */}
              <div className="winner-hero-box">
                <span className="winner-label">PREDICTED WINNER</span>
                <h2 className="winner-name">{prediction.predicted_winner}</h2>
                <div className="winner-badge-pill">Highest Win Likelihood</div>
              </div>

              {/* Donut chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>Win Probability Split</span>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={4} dataKey="value">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Probability cards */}
              <div className="prob-cards-duo">
                <div className={`prob-card ${prediction.predicted_winner === team1 ? 'winner' : ''}`}>
                  <span className="prob-team">TEAM 1</span>
                  <span className="prob-team-name">{team1}</span>
                  <span className="prob-value">{(prob1 * 100).toFixed(2)}%</span>
                </div>
                <div className={`prob-card ${prediction.predicted_winner === team2 ? 'winner' : ''}`}>
                  <span className="prob-team">TEAM 2</span>
                  <span className="prob-team-name">{team2}</span>
                  <span className="prob-value">{(prob2 * 100).toFixed(2)}%</span>
                </div>
              </div>

              {/* Radar chart — team metrics comparison */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>Feature Comparison Radar</span>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,.08)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar name={team1} dataKey="team1" stroke="#10b981" fill="#10b981" fillOpacity={0.18} />
                    <Radar name={team2} dataKey="team2" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.18} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
