import React, { useEffect, useState } from 'react';
import {
  Zap, Sparkles, AlertCircle, RefreshCw, CheckCircle2, Activity
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { getTeams, getVenues, getMatches, predictLiveWinProbability } from '../services/api';
import type { LiveWinProbabilityResponse, LiveWinProbabilityRequest } from '../services/api';

const GaugeTooltip = () => null; // suppress default tooltip for gauge

export const LiveWinProbabilityPage: React.FC = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [venues, setVenues] = useState<{ venue: string }[]>([]);

  const [battingTeam, setBattingTeam] = useState<string>('');
  const [bowlingTeam, setBowlingTeam] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [city, setCity] = useState<string>('');

  const [currentScore, setCurrentScore] = useState<number>(140);
  const [wicketsFallen, setWicketsFallen] = useState<number>(3);
  const [legalBallsBowled, setLegalBallsBowled] = useState<number>(90);
  const [target, setTarget] = useState<number>(180);
  const [runsLast6, setRunsLast6] = useState<number>(10);
  const [runsLast30, setRunsLast30] = useState<number>(45);
  const [wicketsLast30, setWicketsLast30] = useState<number>(1);
  const [boundariesSoFar, setBoundariesSoFar] = useState<number>(12);
  const [partnershipRuns, setPartnershipRuns] = useState<number>(35);

  const [prediction, setPrediction] = useState<LiveWinProbabilityResponse | null>(null);
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

        if (teamsRes.teams.length >= 2) {
          setBattingTeam(teamsRes.teams[0]);
          setBowlingTeam(teamsRes.teams[1]);
        }
        if (venueList.length > 0) {
          const selVenue = venueList[0].venue;
          setVenue(selVenue);
          fetchVenueCity(selVenue);
        }
        setLoadingInit(false);
      })
      .catch((err) => {
        setErrorPredict(err.message || 'Failed to initialize live win probability predictor.');
        setLoadingInit(false);
      });
  }, []);

  const fetchVenueCity = (selectedVenue: string) => {
    getMatches({ venue: selectedVenue, limit: 1 })
      .then((mRes) => {
        setCity(mRes.matches.length > 0 && mRes.matches[0].city ? mRes.matches[0].city : '');
      })
      .catch(() => setCity(''));
  };

  const handleVenueChange = (val: string) => {
    setVenue(val);
    fetchVenueCity(val);
  };

  const validateInputs = (): boolean => {
    if (battingTeam === bowlingTeam) { setValidationError('Batting team and bowling team must be different franchises.'); return false; }
    if (wicketsFallen < 0 || wicketsFallen > 10) { setValidationError('Wickets fallen must be between 0 and 10.'); return false; }
    if (legalBallsBowled < 0 || legalBallsBowled > 120) { setValidationError('Legal balls bowled must be between 0 and 120.'); return false; }
    if (target <= 0) { setValidationError('Target score must be greater than 0.'); return false; }
    if (currentScore < 0) { setValidationError('Current score cannot be negative.'); return false; }
    if (currentScore >= target) { setValidationError('Current score must be less than target for an active chase.'); return false; }
    setValidationError(null);
    return true;
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoadingPredict(true);
    setErrorPredict(null);

    const payload: LiveWinProbabilityRequest = {
      batting_team: battingTeam,
      bowling_team: bowlingTeam,
      venue,
      city,
      current_score: Number(currentScore),
      wickets_fallen: Number(wicketsFallen),
      legal_balls_bowled: Number(legalBallsBowled),
      target: Number(target),
      runs_last_6_balls: Number(runsLast6),
      runs_last_30_balls: Number(runsLast30),
      wickets_last_30_balls: Number(wicketsLast30),
      boundaries_so_far: Number(boundariesSoFar),
      partnership_runs: Number(partnershipRuns),
    };

    predictLiveWinProbability(payload)
      .then((data) => { setPrediction(data); setLoadingPredict(false); })
      .catch(() => { setErrorPredict('Unable to calculate probability. Please check the match state and try again.'); setLoadingPredict(false); });
  };

  // Derived
  const wicketsInHand = Math.max(0, 10 - wicketsFallen);
  const oversCompletedVal = legalBallsBowled / 6.0;
  const ballsRemaining = Math.max(0, 120 - legalBallsBowled);
  const currentRunRateVal = oversCompletedVal > 0 ? currentScore / oversCompletedVal : 0;
  const runsRequired = Math.max(0, target - currentScore);
  const oversRemVal = ballsRemaining / 6.0;
  const requiredRunRateVal = oversRemVal > 0 ? runsRequired / oversRemVal : (runsRequired === 0 ? 0 : 99.99);
  const crrMinusRrrVal = currentRunRateVal - requiredRunRateVal;
  const crrMinusRrrStr = crrMinusRrrVal >= 0 ? `+${crrMinusRrrVal.toFixed(2)}` : crrMinusRrrVal.toFixed(2);

  const battingProbPct = prediction ? prediction.batting_team_win_probability * 100 : 0;
  const bowlingProbPct = prediction ? prediction.bowling_team_win_probability * 100 : 0;
  const favoriteTeam = battingProbPct >= bowlingProbPct ? (prediction?.batting_team ?? '') : (prediction?.bowling_team ?? '');
  const favoriteProb = Math.max(battingProbPct, bowlingProbPct);

  // Gauge color
  const gaugeColor = favoriteProb >= 70 ? '#10b981' : favoriteProb >= 50 ? '#fbbf24' : '#ef4444';

  // Single gauge data for RadialBarChart
  const gaugeData = [{ value: favoriteProb, fill: gaugeColor }];

  const donutData = prediction ? [
    { name: prediction.batting_team, value: battingProbPct, color: '#10b981' },
    { name: prediction.bowling_team, value: bowlingProbPct, color: '#14b8a6' },
  ] : [];


  return (
    <div className="predict-page-container">
      <section className="predict-page-header">
        <div>
          <h1>Live Win Probability</h1>
          <p>XGBoost model computing 2nd-innings chase win probability from live match state features.</p>
        </div>
      </section>

      <div className="predict-wide-layout">
        <form className="predict-form-card" onSubmit={handlePredict}>
          <div className="card-header-badge"><Zap size={18} /><span>Match State Inputs</span></div>

          {loadingInit ? (
            <div className="predict-loading-skeleton" />
          ) : (
            <div className="form-fields">
              <div className="form-row-4">
                <div className="form-group">
                  <label htmlFor="lwp-batting">Batting Team</label>
                  <select id="lwp-batting" className="custom-select" value={battingTeam} onChange={(e) => setBattingTeam(e.target.value)}>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-bowling">Bowling Team</label>
                  <select id="lwp-bowling" className="custom-select" value={bowlingTeam} onChange={(e) => setBowlingTeam(e.target.value)}>
                    {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-venue">Venue</label>
                  <select id="lwp-venue" className="custom-select" value={venue} onChange={(e) => handleVenueChange(e.target.value)}>
                    {venues.map((v) => <option key={v.venue} value={v.venue}>{v.venue}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-city">City</label>
                  <input id="lwp-city" type="text" className="custom-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Match city" />
                </div>
              </div>

              <div className="form-row-4">
                <div className="form-group">
                  <label htmlFor="lwp-score">Current Score</label>
                  <input id="lwp-score" type="number" className="custom-input" min="0" max="300" value={currentScore} onChange={(e) => setCurrentScore(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-wickets">Wickets Fallen (0–10)</label>
                  <input id="lwp-wickets" type="number" className="custom-input" min="0" max="10" value={wicketsFallen} onChange={(e) => setWicketsFallen(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-balls">Legal Balls Bowled (0–120)</label>
                  <input id="lwp-balls" type="number" className="custom-input" min="0" max="120" value={legalBallsBowled} onChange={(e) => setLegalBallsBowled(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-target">Target Score</label>
                  <input id="lwp-target" type="number" className="custom-input" min="1" max="300" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="lwp-runs6">Runs (Last 6 Balls)</label>
                  <input id="lwp-runs6" type="number" className="custom-input" min="0" max="36" value={runsLast6} onChange={(e) => setRunsLast6(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-runs30">Runs (Last 30 Balls)</label>
                  <input id="lwp-runs30" type="number" className="custom-input" min="0" max="180" value={runsLast30} onChange={(e) => setRunsLast30(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-wkts30">Wickets (Last 30 Balls)</label>
                  <input id="lwp-wkts30" type="number" className="custom-input" min="0" max="10" value={wicketsLast30} onChange={(e) => setWicketsLast30(Number(e.target.value))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="lwp-boundaries">Boundaries So Far (4s+6s)</label>
                  <input id="lwp-boundaries" type="number" className="custom-input" min="0" value={boundariesSoFar} onChange={(e) => setBoundariesSoFar(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="lwp-partnership">Active Partnership Runs</label>
                  <input id="lwp-partnership" type="number" className="custom-input" min="0" value={partnershipRuns} onChange={(e) => setPartnershipRuns(Number(e.target.value))} />
                </div>
              </div>

              {/* Derived metrics panel */}
              <div className="derived-metrics-panel">
                <div className="panel-header-row">
                  <span className="panel-title">Derived Match State</span>
                  <Activity size={14} className="text-teal" />
                </div>
                <div className="metrics-grid">
                  <div className="metric-chip"><span className="chip-label">Wickets in Hand</span><span className="chip-val">{wicketsInHand}</span></div>
                  <div className="metric-chip"><span className="chip-label">Overs Done</span><span className="chip-val">{oversCompletedVal.toFixed(1)}</span></div>
                  <div className="metric-chip"><span className="chip-label">Balls Remaining</span><span className="chip-val">{ballsRemaining}</span></div>
                  <div className="metric-chip"><span className="chip-label">CRR</span><span className="chip-val">{currentRunRateVal.toFixed(2)}</span></div>
                  <div className="metric-chip"><span className="chip-label">Runs Required</span><span className="chip-val">{runsRequired}</span></div>
                  <div className="metric-chip"><span className="chip-label">RRR</span><span className="chip-val">{requiredRunRateVal.toFixed(2)}</span></div>
                  <div className="metric-chip"><span className="chip-label">CRR − RRR</span><span className="chip-val" style={{ color: crrMinusRrrVal >= 0 ? 'var(--accent-emerald)' : '#f87171' }}>{crrMinusRrrStr}</span></div>
                </div>
              </div>

              {validationError && (
                <div className="same-team-warning"><AlertCircle size={16} /><span>{validationError}</span></div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loadingPredict || battingTeam === bowlingTeam}>
                {loadingPredict ? <><RefreshCw size={16} className="spin" /><span>Calculating...</span></> : <><Sparkles size={16} /><span>Calculate Win Probability</span></>}
              </button>
            </div>
          )}
        </form>

        {/* Result Panel */}
        <div className="predict-result-card">
          {!prediction && !loadingPredict && !errorPredict && (
            <div className="state-card empty"><Zap size={36} /><h4>Enter Match State</h4><p>Fill in the current match state to calculate live win probability.</p></div>
          )}
          {loadingPredict && (
            <div className="table-loading-card"><div className="loading-spinner" /><span>Calculating live probability...</span></div>
          )}
          {errorPredict && (
            <div className="state-card error"><AlertCircle size={24} /><h4>Unable to calculate probability</h4><p>{errorPredict}</p></div>
          )}

          {prediction && !loadingPredict && (
            <div className="prediction-display">
              <div className="model-badge"><CheckCircle2 size={15} /><span>Powered by XGBoost Model</span></div>

              {/* Favorite team hero — shows the team with HIGHER probability */}
              <div className="winner-hero-box">
                <span className="winner-label">FAVORITE TO WIN</span>
                <h2 className="winner-name">{favoriteTeam}</h2>
                <div className="winner-badge-pill">{favoriteProb.toFixed(1)}% Win Probability</div>
              </div>

              {/* Single gauge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', padding: '0.5rem 0' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>{favoriteTeam} Win Probability</span>
                <div style={{ position: 'relative', width: 220, height: 120 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <RadialBarChart
                      cx="50%" cy="100%"
                      innerRadius={70} outerRadius={90}
                      startAngle={180} endAngle={0}
                      data={gaugeData}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" angleAxisId={0} cornerRadius={6} />
                      <Tooltip content={<GaugeTooltip />} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: gaugeColor, lineHeight: 1, letterSpacing: '-0.02em' }}>{favoriteProb.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Win split donut */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>Win Probability Split</span>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} contentStyle={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="prob-cards-duo">
                  <div className={`prob-card ${battingProbPct >= bowlingProbPct ? 'winner' : ''}`}>
                    <span className="prob-team">BATTING</span>
                    <span className="prob-team-name">{prediction.batting_team}</span>
                    <span className="prob-value">{battingProbPct.toFixed(1)}%</span>
                  </div>
                  <div className={`prob-card ${bowlingProbPct > battingProbPct ? 'winner' : ''}`}>
                    <span className="prob-team">BOWLING</span>
                    <span className="prob-team-name">{prediction.bowling_team}</span>
                    <span className="prob-value">{bowlingProbPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Situation analysis */}
              <div className="current-match-context">
                <h4>Match Situation Analysis</h4>
                <div className="context-grid">
                  <div className="context-item">
                    <span className="ctx-label">Current Score</span>
                    <span className="ctx-val">{currentScore}/{wicketsFallen}</span>
                  </div>
                  <div className="context-item">
                    <span className="ctx-label">Target</span>
                    <span className="ctx-val">{target} runs</span>
                  </div>
                  <div className="context-item">
                    <span className="ctx-label">Overs Completed</span>
                    <span className="ctx-val">{oversCompletedVal.toFixed(1)} ({legalBallsBowled} balls)</span>
                  </div>
                  <div className="context-item">
                    <span className="ctx-label">Runs Required</span>
                    <span className="ctx-val">{runsRequired} off {ballsRemaining} balls</span>
                  </div>
                  <div className="context-item">
                    <span className="ctx-label">CRR vs RRR</span>
                    <span className="ctx-val" style={{ color: crrMinusRrrVal >= 0 ? 'var(--accent-emerald)' : '#f87171' }}>
                      {currentRunRateVal.toFixed(2)} vs {requiredRunRateVal.toFixed(2)} ({crrMinusRrrStr})
                    </span>
                  </div>
                  <div className="context-item">
                    <span className="ctx-label">Wickets in Hand</span>
                    <span className="ctx-val">{wicketsInHand}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
