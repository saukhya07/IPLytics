import React, { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { getTeams, getVenues, getMatches, predictScore } from '../services/api';
import type { ScorePredictionResponse, ScorePredictionRequest } from '../services/api';

const ScoreTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <p style={{ color: 'var(--text-muted)' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.fill || '#10b981', fontWeight: 700 }}>{p.value} runs</p>
        ))}
      </div>
    );
  }
  return null;
};

export const ScorePredictionPage: React.FC = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [venues, setVenues] = useState<{ venue: string }[]>([]);

  const [battingTeam, setBattingTeam] = useState<string>('');
  const [bowlingTeam, setBowlingTeam] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [city, setCity] = useState<string>('');

  const [currentScore, setCurrentScore] = useState<number>(120);
  const [wicketsFallen, setWicketsFallen] = useState<number>(2);
  const [legalBallsBowled, setLegalBallsBowled] = useState<number>(80);
  const [runsLast6, setRunsLast6] = useState<number>(8);
  const [runsLast30, setRunsLast30] = useState<number>(40);
  const [wicketsLast30, setWicketsLast30] = useState<number>(1);
  const [boundariesSoFar, setBoundariesSoFar] = useState<number>(10);
  const [partnershipRuns, setPartnershipRuns] = useState<number>(35);

  const [prediction, setPrediction] = useState<ScorePredictionResponse | null>(null);
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [loadingPredict, setLoadingPredict] = useState<boolean>(false);
  const [errorPredict, setErrorPredict] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTeams(), getVenues()])
      .then(([teamsRes, venuesRes]) => {
        setTeams(teamsRes.teams);
        const venueList = venuesRes.venues.map((v) => ({ venue: v.venue }));
        setVenues(venueList);
        if (teamsRes.teams.length >= 2) { setBattingTeam(teamsRes.teams[0]); setBowlingTeam(teamsRes.teams[1]); }
        if (venueList.length > 0) { setVenue(venueList[0].venue); fetchVenueCity(venueList[0].venue); }
        setLoadingInit(false);
      })
      .catch((err) => { setErrorPredict(err.message || 'Failed to initialize.'); setLoadingInit(false); });
  }, []);

  const fetchVenueCity = (selectedVenue: string) => {
    getMatches({ venue: selectedVenue, limit: 1 })
      .then((mRes) => setCity(mRes.matches.length > 0 && mRes.matches[0].city ? mRes.matches[0].city : ''))
      .catch(() => setCity(''));
  };

  const handleVenueChange = (val: string) => { setVenue(val); fetchVenueCity(val); };

  const validateInputs = (): boolean => {
    if (battingTeam === bowlingTeam) { setValidationError('Batting and bowling teams must differ.'); return false; }
    if (wicketsFallen < 0 || wicketsFallen > 10) { setValidationError('Wickets must be 0–10.'); return false; }
    if (legalBallsBowled < 0 || legalBallsBowled > 120) { setValidationError('Balls bowled must be 0–120.'); return false; }
    if (currentScore < 0) { setValidationError('Score cannot be negative.'); return false; }
    setValidationError(null);
    return true;
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoadingPredict(true);
    setErrorPredict(null);

    const payload: ScorePredictionRequest = {
      batting_team: battingTeam, bowling_team: bowlingTeam, venue, city,
      current_score: Number(currentScore), wickets_fallen: Number(wicketsFallen),
      legal_balls_bowled: Number(legalBallsBowled), runs_last_6_balls: Number(runsLast6),
      runs_last_30_balls: Number(runsLast30), wickets_last_30_balls: Number(wicketsLast30),
      boundaries_so_far: Number(boundariesSoFar), partnership_runs: Number(partnershipRuns),
    };

    predictScore(payload)
      .then((data) => { setPrediction(data); setLoadingPredict(false); })
      .catch((err) => { setErrorPredict(err.message || 'Failed to generate score prediction.'); setLoadingPredict(false); });
  };

  const oversCompleted = (legalBallsBowled / 6.0).toFixed(1);
  const currentRunRate = legalBallsBowled > 0 ? (currentScore / (legalBallsBowled / 6.0)).toFixed(2) : '0.00';

  // Score projection bar chart — shows current score vs projected final vs range
  const projectedScore = prediction?.predicted_final_score ?? 0;
  const lowRange = Math.max(0, Math.round(projectedScore * 0.92));
  const highRange = Math.round(projectedScore * 1.08);

  const projectionChartData = prediction ? [
    { label: 'Current', value: currentScore, fill: '#64748b' },
    { label: 'Projected Low', value: lowRange, fill: '#14b8a6' },
    { label: 'Prediction', value: Math.round(projectedScore), fill: '#10b981' },
    { label: 'Projected High', value: highRange, fill: '#06b6d4' },
  ] : [];

  return (
    <div className="predict-page-container">
      <section className="predict-page-header">
        <div>
          <h1>Innings Final Score Predictor</h1>
          <p>XGBoost regression model projecting 1st-innings total from current match state.</p>
        </div>
      </section>

      <div className="predict-wide-layout">
        <form className="predict-form-card" onSubmit={handlePredict}>
          <div className="card-header-badge"><TrendingUp size={18} /><span>Innings State Inputs</span></div>

          {loadingInit ? (
            <div className="predict-loading-skeleton" />
          ) : (
            <div className="form-fields">
              <div className="form-row-4">
                <div className="form-group">
                  <label htmlFor="sp-batting">Batting Team</label>
                  <select id="sp-batting" className="custom-select" value={battingTeam} onChange={(e) => setBattingTeam(e.target.value)}>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="sp-bowling">Bowling Team</label>
                  <select id="sp-bowling" className="custom-select" value={bowlingTeam} onChange={(e) => setBowlingTeam(e.target.value)}>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="sp-venue">Venue</label>
                  <select id="sp-venue" className="custom-select" value={venue} onChange={(e) => handleVenueChange(e.target.value)}>
                    {venues.map((v) => <option key={v.venue} value={v.venue}>{v.venue}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="sp-city">City</label>
                  <input id="sp-city" type="text" className="custom-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Match city" />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="sp-score">Current Runs Scored</label>
                  <input id="sp-score" type="number" className="custom-input" min="0" max="300" value={currentScore} onChange={(e) => setCurrentScore(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="sp-wickets">Wickets Fallen (0–10)</label>
                  <input id="sp-wickets" type="number" className="custom-input" min="0" max="10" value={wicketsFallen} onChange={(e) => setWicketsFallen(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="sp-balls">Legal Balls Bowled (0–120)</label>
                  <input id="sp-balls" type="number" className="custom-input" min="0" max="120" value={legalBallsBowled} onChange={(e) => setLegalBallsBowled(Number(e.target.value))} />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="sp-partnership">Active Partnership Runs</label>
                  <input id="sp-partnership" type="number" className="custom-input" min="0" value={partnershipRuns} onChange={(e) => setPartnershipRuns(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="sp-runs6">Runs (Last 6 Balls)</label>
                  <input id="sp-runs6" type="number" className="custom-input" min="0" max="36" value={runsLast6} onChange={(e) => setRunsLast6(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="sp-runs30">Runs (Last 30 Balls)</label>
                  <input id="sp-runs30" type="number" className="custom-input" min="0" max="180" value={runsLast30} onChange={(e) => setRunsLast30(Number(e.target.value))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="sp-wkts30">Wickets (Last 30 Balls)</label>
                  <input id="sp-wkts30" type="number" className="custom-input" min="0" max="10" value={wicketsLast30} onChange={(e) => setWicketsLast30(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="sp-boundaries">Total Boundaries (4s+6s)</label>
                  <input id="sp-boundaries" type="number" className="custom-input" min="0" value={boundariesSoFar} onChange={(e) => setBoundariesSoFar(Number(e.target.value))} />
                </div>
              </div>

              {validationError && <div className="same-team-warning"><AlertCircle size={16} /><span>{validationError}</span></div>}

              <button type="submit" className="btn btn-primary btn-block" disabled={loadingPredict || battingTeam === bowlingTeam}>
                {loadingPredict ? <><RefreshCw size={16} className="spin" /><span>Predicting...</span></> : <><Sparkles size={16} /><span>Predict Final Score</span></>}
              </button>
            </div>
          )}
        </form>

        {/* Result Panel */}
        <div className="predict-result-card">
          {!prediction && !loadingPredict && !errorPredict && (
            <div className="state-card empty"><TrendingUp size={36} /><h4>Enter Innings State</h4><p>Fill in score, overs, and recent stats to project the final total.</p></div>
          )}
          {loadingPredict && <div className="table-loading-card"><div className="loading-spinner" /><span>Executing XGBoost Score Regressor...</span></div>}
          {errorPredict && <div className="state-card error"><AlertCircle size={24} /><h4>Unable to generate score prediction</h4><p>{errorPredict}</p></div>}

          {prediction && !loadingPredict && (
            <div className="prediction-display">
              <div className="model-badge"><CheckCircle2 size={15} /><span>Powered by XGBoost Regressor Model</span></div>

              {/* Big number output */}
              <div className="score-output-hero">
                <span className="score-output-label">PROJECTED FINAL SCORE</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
                  <span className="score-output-runs">{Math.round(prediction.predicted_final_score)}</span>
                  <span className="score-output-unit">runs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.3rem' }}>
                  <span className="winner-badge-pill" style={{ background: 'rgba(6,182,212,.12)', borderColor: 'rgba(6,182,212,.25)', color: '#06b6d4' }}>
                    Range: {lowRange} – {highRange}
                  </span>
                </div>
                <span className="score-output-unit" style={{ fontSize: '.75rem', marginTop: '.2rem' }}>±8% confidence band · 1st innings estimate</span>
              </div>

              {/* Score projection bar chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>Score Projection Breakdown</span>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={projectionChartData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, highRange + 20]} />
                    <Tooltip content={<ScoreTooltip />} />
                    <ReferenceLine y={currentScore} stroke="rgba(255,255,255,.15)" strokeDasharray="3 3" />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {projectionChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Context */}
              <div className="current-match-context">
                <h4>Innings State at Prediction</h4>
                <div className="context-grid">
                  <div className="context-item"><span className="ctx-label">Current Score</span><span className="ctx-val">{currentScore}/{wicketsFallen}</span></div>
                  <div className="context-item"><span className="ctx-label">Overs Completed</span><span className="ctx-val">{oversCompleted} ({legalBallsBowled} balls)</span></div>
                  <div className="context-item"><span className="ctx-label">Current Run Rate</span><span className="ctx-val">{currentRunRate} CRR</span></div>
                  <div className="context-item"><span className="ctx-label">Active Partnership</span><span className="ctx-val">{partnershipRuns} runs</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
