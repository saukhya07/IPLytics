import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  PlayCircle, PauseCircle, RotateCcw, Sparkles,
  AlertCircle, RefreshCw, Trophy, Zap, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  getSimulatorMatches, startSimulation, stepSimulation, resetSimulation
} from '../services/api';
import type { SimulatorMatch, SimulatorStartResponse, SimulatorStepResponse } from '../services/api';

interface ProbPoint { ball: number; batting: number; bowling: number; }

const SPEED_DELAYS: Record<number, number> = { 1: 1200, 2: 600, 5: 200 };

const SimTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0e1524', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Ball {label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value?.toFixed(1)}%</p>
        ))}
      </div>
    );
  }
  return null;
};

function getBallChipClass(step: SimulatorStepResponse): string {
  if (step.is_wicket) return 'wicket';
  const runs = (step.runs_off_bat ?? 0) + (step.extra_runs ?? 0);
  if (runs >= 6) return 'six';
  if (runs >= 4) return 'boundary';
  if (runs === 0) return 'dot';
  return '';
}

function getBallLabel(step: SimulatorStepResponse): string {
  if (step.is_wicket) return 'W';
  const runs = (step.runs_off_bat ?? 0) + (step.extra_runs ?? 0);
  return String(runs);
}

export const SimulatorPage: React.FC = () => {
  const [matches, setMatches] = useState<SimulatorMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [session, setSession] = useState<SimulatorStartResponse | null>(null);
  const [lastStep, setLastStep] = useState<SimulatorStepResponse | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<SimulatorStepResponse[]>([]);
  const [probHistory, setProbHistory] = useState<ProbPoint[]>([]);

  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [loadingStart, setLoadingStart] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<boolean>(false);
  const [loadingReset, setLoadingReset] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-play
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationIdRef = useRef<string | null>(null);
  const isFinishedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { simulationIdRef.current = simulationId; }, [simulationId]);

  useEffect(() => {
    getSimulatorMatches(50)
      .then((res) => {
        setMatches(res.matches);
        if (res.matches.length > 0) setSelectedMatchId(res.matches[0].match_id);
        setLoadingMatches(false);
      })
      .catch((err) => { setErrorMessage(err.message || 'Failed to load historical matches.'); setLoadingMatches(false); });
  }, []);

  const selectedMatch = matches.find((m) => m.match_id === selectedMatchId) || null;

  // Step function — returns promise so auto-play can chain
  const doStep = useCallback((simId: string): Promise<SimulatorStepResponse> => {
    return stepSimulation(simId).then((data) => {
      setLastStep(data);
      if (data.delivery_number) {
        setDeliveryHistory((prev) => [data, ...prev]);
        setProbHistory((prev) => [
          ...prev,
          { ball: data.delivery_number!, batting: data.batting_team_win_probability * 100, bowling: data.bowling_team_win_probability * 100 },
        ]);
      }
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          current_score: data.current_score ?? prev.current_score,
          wickets_fallen: data.wickets_fallen ?? prev.wickets_fallen,
          balls_remaining: data.balls_remaining ?? prev.balls_remaining,
          current_run_rate: data.current_run_rate ?? prev.current_run_rate,
          required_run_rate: data.required_run_rate ?? prev.required_run_rate,
          batting_team_win_probability: data.batting_team_win_probability,
          bowling_team_win_probability: data.bowling_team_win_probability,
          match_finished: data.match_finished,
        };
      });
      isFinishedRef.current = data.match_finished;
      return data;
    });
  }, []);

  // Auto play loop
  const scheduleNextBall = useCallback(() => {
    if (isFinishedRef.current || !simulationIdRef.current) {
      setAutoPlaying(false);
      return;
    }
    const delay = SPEED_DELAYS[speed];
    autoPlayRef.current = setTimeout(() => {
      const simId = simulationIdRef.current;
      if (!simId || isFinishedRef.current) { setAutoPlaying(false); return; }
      setLoadingStep(true);
      doStep(simId)
        .then((data) => {
          setLoadingStep(false);
          if (data.match_finished) { setAutoPlaying(false); return; }
          scheduleNextBall();
        })
        .catch(() => { setAutoPlaying(false); setLoadingStep(false); });
    }, delay);
  }, [speed, doStep]);

  useEffect(() => {
    if (autoPlaying) {
      scheduleNextBall();
    } else {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    }
    return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current); };
  }, [autoPlaying, scheduleNextBall]);

  const handleStartSimulation = () => {
    if (!selectedMatchId) return;
    setLoadingStart(true);
    setErrorMessage(null);
    setLastStep(null);
    setDeliveryHistory([]);
    setProbHistory([]);
    isFinishedRef.current = false;
    setAutoPlaying(false);

    startSimulation(selectedMatchId)
      .then((data) => {
        setSession(data);
        setSimulationId(data.simulation_id);
        simulationIdRef.current = data.simulation_id;
        setProbHistory([{ ball: 0, batting: data.batting_team_win_probability * 100, bowling: data.bowling_team_win_probability * 100 }]);
        setLoadingStart(false);
      })
      .catch((err) => { setErrorMessage(err.message || 'Unable to start simulation.'); setLoadingStart(false); });
  };

  const handleNextBall = () => {
    if (!simulationId || loadingStep) return;
    setLoadingStep(true);
    setErrorMessage(null);
    doStep(simulationId).then(() => setLoadingStep(false)).catch((err) => {
      setErrorMessage(err.message || 'Unable to process delivery.');
      setLoadingStep(false);
    });
  };

  const handleResetSimulation = () => {
    if (!simulationId) return;
    setAutoPlaying(false);
    isFinishedRef.current = false;
    setLoadingReset(true);
    setErrorMessage(null);
    resetSimulation(simulationId)
      .then((data) => {
        setLastStep(null);
        setDeliveryHistory([]);
        setProbHistory([{ ball: 0, batting: data.batting_team_win_probability * 100, bowling: data.bowling_team_win_probability * 100 }]);
        if (session) {
          setSession((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              current_score: 0,
              wickets_fallen: 0,
              balls_remaining: 120,
              current_run_rate: 0,
              required_run_rate: Number((prev.target / 20.0).toFixed(2)),
              batting_team_win_probability: data.batting_team_win_probability,
              bowling_team_win_probability: data.bowling_team_win_probability,
              match_finished: false,
            };
          });
        }
        setLoadingReset(false);
      })
      .catch((err) => { setErrorMessage(err.message || 'Failed to reset.'); setLoadingReset(false); });
  };

  const battingProbPct = session ? session.batting_team_win_probability * 100 : 50;
  const bowlingProbPct = session ? session.bowling_team_win_probability * 100 : 50;
  const currentScoreVal = session?.current_score ?? 0;
  const wicketsFallenVal = session?.wickets_fallen ?? 0;
  const targetVal = session?.target ?? (selectedMatch?.target_runs || 0);
  const ballsRemainingVal = session?.balls_remaining ?? 120;
  const ballsCompleted = 120 - ballsRemainingVal;
  const oversStr = (ballsCompleted / 6).toFixed(1);
  const runsRequired = Math.max(0, targetVal - currentScoreVal);
  const isFinished = session?.match_finished || lastStep?.match_finished;

  // Last 6 balls from deliveryHistory (index 0 = most recent)
  const last6 = deliveryHistory.slice(0, 6).reverse();

  return (
    <div className="predict-page-container">
      <section className="page-header">
        <div>
          <h1>Historical Match Simulator</h1>
          <p>Replay real IPL 2nd-innings chases ball-by-ball with live ML win probability.</p>
        </div>
      </section>

      {/* Match Selector */}
      <div className="h2h-selector-card">
        <div className="card-header-badge"><PlayCircle size={18} /><span>Chase Selection</span></div>
        {loadingMatches ? (
          <div className="table-loading-card"><div className="loading-spinner" /><span>Loading matches...</span></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label htmlFor="sim-match-select">Historical IPL Chase</label>
              <select id="sim-match-select" className="custom-select" value={selectedMatchId ?? ''} disabled={!!session}
                onChange={(e) => setSelectedMatchId(Number(e.target.value))}>
                {matches.map((m) => (
                  <option key={m.match_id} value={m.match_id}>
                    {m.season} · {m.team1} vs {m.team2} · Target: {m.target_runs}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleStartSimulation} disabled={!selectedMatchId || loadingStart || !!session}>
              {loadingStart ? <><RefreshCw size={16} className="spin" /><span>Starting...</span></> : <><Sparkles size={16} /><span>Start Chase</span></>}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="state-card error"><AlertCircle size={20} /><span>{errorMessage}</span></div>
      )}

      {/* Main 2-column simulation view */}
      {session && (
        <div className="sim-two-col">
          {/* LEFT: Score + Controls */}
          <div className="sim-left">
            {/* Score hero */}
            <div className="sim-score-hero">
              <span className="sim-score-label">{session.batting_team} CHASING</span>
              <div className="sim-score-main">{currentScoreVal}/{wicketsFallenVal}</div>
              <div className="sim-score-overs">{oversStr} overs · {ballsRemainingVal} balls remaining</div>
              <div className="sim-target-pill">Target: {targetVal} · Need {runsRequired} more</div>
            </div>

            {/* Win prob badge */}
            <div className="live-prob-badge">
              <Activity size={14} />
              <span>{battingProbPct > bowlingProbPct ? session.batting_team : session.bowling_team}</span>
              <strong>{Math.max(battingProbPct, bowlingProbPct).toFixed(1)}%</strong>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>win probability</span>
            </div>

            {/* Controls */}
            {!isFinished ? (
              <div className="sim-controls">
                <button className="btn btn-primary" onClick={handleNextBall} disabled={loadingStep || autoPlaying || isFinished as boolean}>
                  {loadingStep && !autoPlaying ? <><RefreshCw size={16} className="spin" /><span>Bowling...</span></> : <><Zap size={16} /><span>Next Ball</span></>}
                </button>

                {autoPlaying ? (
                  <button className="btn btn-secondary" onClick={() => setAutoPlaying(false)}>
                    <PauseCircle size={16} /><span>Pause</span>
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => setAutoPlaying(true)} disabled={loadingStep || isFinished as boolean}>
                    <PlayCircle size={16} /><span>Auto Play</span>
                  </button>
                )}

                <div className="sim-speed-group">
                  <span className="sim-speed-label">Speed:</span>
                  {([1, 2, 5] as (1 | 2 | 5)[]).map((s) => (
                    <button key={s} className={`speed-btn ${speed === s ? 'active' : ''}`}
                      onClick={() => setSpeed(s)}>{s}x</button>
                  ))}
                </div>

                <button className="btn btn-secondary btn-sm" onClick={handleResetSimulation} disabled={loadingReset}>
                  <RotateCcw size={14} /><span>Reset</span>
                </button>
              </div>
            ) : (
              <div className="match-finished-card">
                <Trophy size={28} />
                <h3>{lastStep?.actual_winner || session.batting_team} Won!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{lastStep?.actual_result || 'Match Complete'}</p>
                <button className="btn btn-secondary btn-sm" onClick={handleResetSimulation} disabled={loadingReset}>
                  <RotateCcw size={14} /><span>Replay</span>
                </button>
              </div>
            )}

            {/* Last 6 balls strip */}
            <div className="last-6-strip">
              <span className="last-6-label">Last {last6.length} Balls</span>
              <div className="last-6-balls">
                {last6.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>No deliveries yet</span>
                ) : (
                  last6.map((step, i) => (
                    <div key={i} className={`ball-chip ${getBallChipClass(step)}`} title={step.over_display || ''}>
                      {getBallLabel(step)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Last delivery detail */}
            {lastStep && lastStep.delivery_number && (
              <div className="delivery-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
                    Over {lastStep.over_display}
                  </span>
                  <span className={`winner-pill ${lastStep.is_wicket ? '' : ''}`} style={{ background: lastStep.is_wicket ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.1)', color: lastStep.is_wicket ? '#f87171' : '#34d399', border: lastStep.is_wicket ? '1px solid rgba(239,68,68,.25)' : '1px solid rgba(16,185,129,.25)' }}>
                    {lastStep.is_wicket ? 'WICKET' : `${(lastStep.runs_off_bat ?? 0) + (lastStep.extra_runs ?? 0)} runs`}
                  </span>
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                  {lastStep.batter && <span><strong>{lastStep.batter}</strong> vs {lastStep.bowler}</span>}
                  {lastStep.is_wicket && lastStep.player_dismissed && (
                    <span style={{ color: '#f87171' }}> · {lastStep.player_dismissed} {lastStep.dismissal_kind}</span>
                  )}
                  {lastStep.extras_type && <span style={{ color: 'var(--text-muted)' }}> · {lastStep.extras_type}</span>}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live Win Probability Chart */}
          <div className="sim-right">
            <div className="sim-prob-section">
              <span className="chart-card-title">Live Win Probability</span>
              {probHistory.length <= 1 ? (
                <div className="state-card empty" style={{ padding: '2rem' }}>
                  <Activity size={24} />
                  <p style={{ fontSize: '.82rem' }}>Chart will update ball by ball</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={probHistory} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                    <XAxis dataKey="ball" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Ball', position: 'insideBottomRight', fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<SimTooltip />} />
                    <ReferenceLine y={50} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="batting" name={session.batting_team} stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="bowling" name={session.bowling_team} stroke="#14b8a6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#14b8a6' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Prob cards */}
            <div className="prob-cards-duo">
              <div className={`prob-card ${battingProbPct >= bowlingProbPct ? 'winner' : ''}`}>
                <span className="prob-team">BATTING</span>
                <span className="prob-team-name">{session.batting_team}</span>
                <span className="prob-value">{battingProbPct.toFixed(1)}%</span>
              </div>
              <div className={`prob-card ${bowlingProbPct > battingProbPct ? 'winner' : ''}`}>
                <span className="prob-team">BOWLING</span>
                <span className="prob-team-name">{session.bowling_team}</span>
                <span className="prob-value">{bowlingProbPct.toFixed(1)}%</span>
              </div>
            </div>

            {/* Match context */}
            <div className="current-match-context">
              <h4>Match Context</h4>
              <div className="context-grid">
                <div className="context-item"><span className="ctx-label">Venue</span><span className="ctx-val">{session.venue}</span></div>
                <div className="context-item"><span className="ctx-label">City</span><span className="ctx-val">{session.city || '—'}</span></div>
                <div className="context-item"><span className="ctx-label">CRR</span><span className="ctx-val">{(session.current_run_rate ?? 0).toFixed(2)}</span></div>
                <div className="context-item"><span className="ctx-label">RRR</span><span className="ctx-val">{(session.required_run_rate ?? 0).toFixed(2)}</span></div>
              </div>
            </div>

            {/* Delivery log (compact) */}
            {deliveryHistory.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxHeight: 200, overflowY: 'auto' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
                  Recent Deliveries
                </span>
                {deliveryHistory.slice(0, 12).map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: 'var(--text-secondary)', padding: '.3rem .5rem', borderRadius: 4, background: 'rgba(255,255,255,.02)' }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 38 }}>{step.over_display}</span>
                    <span style={{ fontWeight: 600, color: step.is_wicket ? '#f87171' : step.runs_off_bat && step.runs_off_bat >= 4 ? '#10b981' : 'var(--text-primary)', minWidth: 14 }}>
                      {getBallLabel(step)}
                    </span>
                    <span>{step.batter || '—'}</span>
                    {step.is_wicket && <span style={{ color: '#f87171' }}>• OUT</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
