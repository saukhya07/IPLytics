import React, { useEffect, useState } from 'react';
import { Award, Users, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { getPlayers, getPlayer, predictPlayerOfMatch } from '../services/api';
import type { PlayerOfMatchResponse, PlayerOfMatchRequest, PlayerStats } from '../services/api';

export const PlayerOfMatchPage: React.FC = () => {
  const [playerList, setPlayerList] = useState<PlayerStats[]>([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');

  const [histRuns, setHistRuns] = useState<number>(8000);
  const [histBallsFaced, setHistBallsFaced] = useState<number>(6000);
  const [histStrikeRate, setHistStrikeRate] = useState<number>(132.0);
  const [histWickets, setHistWickets] = useState<number>(4);
  const [histBallsBowled, setHistBallsBowled] = useState<number>(150);
  const [histRunsConceded, setHistRunsConceded] = useState<number>(200);
  const [histEconomy, setHistEconomy] = useState<number>(8.0);
  const [histPomCount, setHistPomCount] = useState<number>(18);
  const [recentAvgRuns5, setRecentAvgRuns5] = useState<number>(45.0);
  const [recentAvgWickets5, setRecentAvgWickets5] = useState<number>(0.0);

  const [prediction, setPrediction] = useState<PlayerOfMatchResponse | null>(null);
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [loadingPredict, setLoadingPredict] = useState<boolean>(false);
  const [errorPredict, setErrorPredict] = useState<string | null>(null);

  useEffect(() => {
    getPlayers({ limit: 100 })
      .then((res) => {
        setPlayerList(res.players);
        if (res.players.length > 0) {
          const defaultP = res.players[0];
          setSelectedPlayerName(defaultP.player);
          populatePlayerStats(defaultP.player);
        }
        setLoadingInit(false);
      })
      .catch((err) => { setErrorPredict(err.message || 'Failed to load player database.'); setLoadingInit(false); });
  }, []);

  const populatePlayerStats = (pName: string) => {
    getPlayer(pName)
      .then((data) => {
        setHistRuns(data.runs);
        setHistBallsFaced(data.balls);
        setHistStrikeRate(data.strike_rate);
        setHistWickets(data.wickets);
        setHistBallsBowled(data.balls_bowled);
        setHistRunsConceded(data.runs_conceded);
        setHistEconomy(data.economy);
      })
      .catch(() => {});
  };

  const handlePlayerChange = (pName: string) => {
    setSelectedPlayerName(pName);
    populatePlayerStats(pName);
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerName) return;
    setLoadingPredict(true);
    setErrorPredict(null);

    const payload: PlayerOfMatchRequest = {
      player: selectedPlayerName,
      hist_runs: Number(histRuns),
      hist_balls_faced: Number(histBallsFaced),
      hist_strike_rate: Number(histStrikeRate),
      hist_wickets: Number(histWickets),
      hist_balls_bowled: Number(histBallsBowled),
      hist_runs_conceded: Number(histRunsConceded),
      hist_economy: Number(histEconomy),
      hist_pom_count: Number(histPomCount),
      recent_avg_runs_5: Number(recentAvgRuns5),
      recent_avg_wickets_5: Number(recentAvgWickets5),
    };

    predictPlayerOfMatch(payload)
      .then((data) => { setPrediction(data); setLoadingPredict(false); })
      .catch((err) => { setErrorPredict(err.message || 'Failed to evaluate Player of Match candidate.'); setLoadingPredict(false); });
  };

  const probPct = prediction ? prediction.probability * 100 : 0;
  const probColor = probPct >= 60 ? '#10b981' : probPct >= 35 ? '#fbbf24' : '#ef4444';

  // Ranked bar chart data — player's metrics vs typical POM benchmark
  const benchmarkData = [
    { metric: 'Career Runs', player: histRuns, benchmark: 3500 },
    { metric: 'Strike Rate', player: histStrikeRate, benchmark: 125 },
    { metric: 'Wickets', player: histWickets, benchmark: 45 },
    { metric: 'Economy', player: histEconomy, benchmark: 8.5 },
    { metric: 'POM Awards', player: histPomCount, benchmark: 8 },
    { metric: 'Recent Runs', player: recentAvgRuns5, benchmark: 28 },
  ];

  // Normalize to 0–100 scale for visual comparison
  const maxVals = [10000, 200, 300, 15, 80, 100];
  const normalizedData = benchmarkData.map((d, i) => ({
    metric: d.metric,
    player: Math.min(100, (d.player / maxVals[i]) * 100),
    benchmark: Math.min(100, (d.benchmark / maxVals[i]) * 100),
    rawPlayer: d.player,
    rawBenchmark: d.benchmark,
  }));

  return (
    <div className="predict-page-container">
      <section className="predict-page-header">
        <div>
          <h1>Player of the Match Candidate Predictor</h1>
          <p>XGBoost model evaluating Player of the Match candidate probability from career + recent form metrics.</p>
        </div>
      </section>

      <div className="predict-wide-layout">
        <form className="predict-form-card" onSubmit={handlePredict}>
          <div className="card-header-badge"><Award size={18} /><span>Player Candidate Inputs</span></div>

          {loadingInit ? (
            <div className="predict-loading-skeleton" />
          ) : (
            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="pom-player-select">Select Player</label>
                <select id="pom-player-select" className="custom-select" value={selectedPlayerName} onChange={(e) => handlePlayerChange(e.target.value)}>
                  {playerList.map((p) => (
                    <option key={p.player} value={p.player}>
                      {p.player} ({p.matches} matches, {p.runs} runs, {p.wickets} wkts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-populated career stats */}
              <div className="derived-metrics-panel">
                <span className="panel-title">Career Statistics (Auto-Populated)</span>
                <div className="metrics-grid">
                  <div className="metric-chip"><span className="chip-label">Career Runs</span><span className="chip-val">{histRuns}</span></div>
                  <div className="metric-chip"><span className="chip-label">Strike Rate</span><span className="chip-val">{histStrikeRate.toFixed(1)}</span></div>
                  <div className="metric-chip"><span className="chip-label">Career Wickets</span><span className="chip-val">{histWickets}</span></div>
                  <div className="metric-chip"><span className="chip-label">Economy</span><span className="chip-val">{histEconomy.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Match state inputs */}
              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="pom-count">Historical POM Awards</label>
                  <input id="pom-count" type="number" className="custom-input" min="0" value={histPomCount} onChange={(e) => setHistPomCount(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="pom-rec-runs">Recent Avg Runs (Last 5)</label>
                  <input id="pom-rec-runs" type="number" className="custom-input" min="0" step="0.1" value={recentAvgRuns5} onChange={(e) => setRecentAvgRuns5(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="pom-rec-wkts">Recent Avg Wickets (Last 5)</label>
                  <input id="pom-rec-wkts" type="number" className="custom-input" min="0" step="0.1" value={recentAvgWickets5} onChange={(e) => setRecentAvgWickets5(Number(e.target.value))} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loadingPredict || !selectedPlayerName}>
                {loadingPredict ? <><RefreshCw size={16} className="spin" /><span>Evaluating Candidate...</span></> : <><Sparkles size={16} /><span>Evaluate Player Candidate</span></>}
              </button>
            </div>
          )}
        </form>

        {/* Result Panel */}
        <div className="predict-result-card">
          {!prediction && !loadingPredict && !errorPredict && (
            <div className="state-card empty"><Users size={36} /><h4>Select a Player</h4><p>Choose an IPL player to evaluate their Player of the Match candidate likelihood.</p></div>
          )}
          {loadingPredict && <div className="table-loading-card"><div className="loading-spinner" /><span>Evaluating XGBoost POM candidate pipeline...</span></div>}
          {errorPredict && <div className="state-card error"><AlertCircle size={24} /><h4>Unable to evaluate player candidate</h4><p>{errorPredict}</p></div>}

          {prediction && !loadingPredict && (
            <div className="prediction-display">
              <div className="model-badge"><CheckCircle2 size={15} /><span>Powered by XGBoost Model</span></div>

              {/* Candidate hero */}
              <div className="winner-hero-box pom-hero">
                <span className="winner-label">PLAYER CANDIDATE</span>
                <h2 className="winner-name">{prediction.predicted_player}</h2>
                <div className="winner-badge-pill" style={{ background: prediction.is_player_of_match_predicted === 1 ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', borderColor: prediction.is_player_of_match_predicted === 1 ? 'rgba(16,185,129,.25)' : 'rgba(245,158,11,.25)', color: prediction.is_player_of_match_predicted === 1 ? 'var(--accent-emerald)' : '#fbbf24' }}>
                  {prediction.is_player_of_match_predicted === 1 ? 'High Candidate Likelihood' : 'Moderate / Low Likelihood'}
                </div>
              </div>

              {/* Big probability number */}
              <div className="candidate-prob-card">
                <div className="candidate-prob-value" style={{ color: probColor }}>
                  {probPct.toFixed(1)}%
                </div>
                <span className="candidate-prob-label">Candidate Win Likelihood Score</span>
                <div style={{ width: '100%', marginTop: '.75rem' }}>
                  <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, probPct)}%`, height: '100%', background: `linear-gradient(90deg, ${probColor}, ${probColor}99)`, borderRadius: 9999, transition: 'width .4s ease' }} />
                  </div>
                </div>
              </div>

              {/* Ranked bar chart vs benchmark */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
                  Player Metrics vs Typical POM Benchmark (Normalized)
                </span>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={normalizedData} layout="vertical" margin={{ top: 0, right: 8, left: 70, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length && normalizedData) {
                          const row = normalizedData.find((d) => d.metric === label);
                          return (
                            <div style={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                              <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                              <p style={{ color: '#10b981', fontWeight: 700 }}>Player: {row?.rawPlayer?.toFixed(1)}</p>
                              <p style={{ color: '#64748b' }}>Benchmark: {row?.rawBenchmark?.toFixed(1)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="benchmark" fill="rgba(100,116,139,.3)" radius={[0, 4, 4, 0]} name="Benchmark" />
                    <Bar dataKey="player" radius={[0, 4, 4, 0]} name="Player">
                      {normalizedData.map((entry, i) => (
                        <Cell key={i} fill={entry.player >= entry.benchmark ? '#10b981' : '#14b8a6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Green bars = player exceeds benchmark. Values normalized to 0–100 scale for visualization.</p>
              </div>

              {/* Stats summary */}
              <div className="player-summary-intel">
                <h4>Player Performance Profile</h4>
                <div className="intel-grid">
                  <div className="intel-box"><span className="intel-lbl">Career Runs</span><span className="intel-val">{histRuns}</span></div>
                  <div className="intel-box"><span className="intel-lbl">Strike Rate</span><span className="intel-val">{histStrikeRate.toFixed(1)}</span></div>
                  <div className="intel-box"><span className="intel-lbl">Wickets</span><span className="intel-val">{histWickets}</span></div>
                  <div className="intel-box"><span className="intel-lbl">Recent 5-Match Form</span><span className="intel-val">{recentAvgRuns5} runs / {recentAvgWickets5} wkts</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
