"""
IPLytics - Simulator Service Module
Phase 5C: Historical Match Simulator + Live ML Engine

Manages server-side simulation sessions for 2nd-innings historical chases.
Performs ball-by-ball delivery state updates and executes the verified XGBoost
Live Win Probability pipeline dynamically after each delivery.

Strict Rules:
- Uses REAL historical deliveries from data/processed/deliveries_clean.csv.
- NO fake or randomly generated cricket data.
- Live features strictly match Phase 3/4 training feature schema.
"""

import os
import uuid
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from fastapi import HTTPException

from backend.model_loader import get_model

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

MATCHES_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'matches_clean.csv')
DELIVERIES_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'deliveries_clean.csv')

# In-memory storage for matches, deliveries, and active simulation sessions
SIM_DATA: Dict[str, Any] = {}
SIMULATION_SESSIONS: Dict[str, Dict[str, Any]] = {}


def load_simulator_data():
    """Load matches and 2nd-innings deliveries into memory for simulation."""
    if 'matches' in SIM_DATA:
        return

    print("Loading data for Historical Match Simulator Service...")
    df_m = pd.read_csv(MATCHES_PATH, dtype={'season': str})
    df_d = pd.read_csv(DELIVERIES_PATH)

    # Calculate 1st innings total scores for target calculation fallback
    inn1_totals = df_d[df_d['inning'] == 1].groupby('match_id')['total_runs'].sum().to_dict()

    # Pre-filter matches with valid 2nd innings deliveries and valid winners
    m_valid = df_m[df_m['winner'].notnull() & (df_m['result'] != 'no result')].copy()
    
    # Check match IDs that actually have 2nd innings deliveries
    match_ids_with_inn2 = set(df_d[df_d['inning'] == 2]['match_id'].unique())
    m_simulatable = m_valid[m_valid['id'].isin(match_ids_with_inn2)].copy()

    # Pre-index 2nd innings deliveries by match_id for fast lookup
    del_inn2 = df_d[df_d['inning'] == 2].copy()
    inn2_by_match = {m_id: group.sort_values(by=['over', 'ball']).to_dict(orient='records') for m_id, group in del_inn2.groupby('match_id')}

    SIM_DATA['matches'] = m_simulatable
    SIM_DATA['inn1_totals'] = inn1_totals
    SIM_DATA['inn2_deliveries'] = inn2_by_match
    print(f" [PASS] Loaded {len(m_simulatable)} simulatable matches into memory.")


def get_simulatable_matches(limit: int = 50) -> List[Dict[str, Any]]:
    """Return list of historical matches suitable for 2nd-innings chase simulation."""
    load_simulator_data()
    df_m = SIM_DATA['matches']
    
    limit = min(max(1, limit), 200)
    records = df_m.sort_values(by='date', ascending=False).head(limit).to_dict(orient='records')
    
    clean_records = []
    for r in records:
        m_id = r['id']
        inn1_total = SIM_DATA['inn1_totals'].get(m_id, 0)
        target = int(r['target_runs']) if (pd.notnull(r.get('target_runs')) and r['target_runs'] > 0) else inn1_total + 1
        
        clean_records.append({
            'match_id': m_id,
            'season': str(r['season']),
            'date': str(r['date']),
            'venue': str(r['venue']),
            'city': str(r['city']) if pd.notnull(r['city']) else "",
            'team1': str(r['team1']),
            'team2': str(r['team2']),
            'winner': str(r['winner']),
            'target_runs': target
        })
    return clean_records


def _compute_live_probabilities(batting_team: str, bowling_team: str, venue: str, city: str,
                                 current_score: int, wickets_fallen: int, legal_balls_bowled: int,
                                 target: float, runs_last_6: int, runs_last_30: int,
                                 wickets_last_30: int, boundaries_so_far: int, partnership_runs: int) -> Tuple[float, float]:
    """Compute live win probabilities using the verified XGBoost model."""
    try:
        pipe = get_model('live_win_probability')
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Live Win Probability model unavailable: {e}")

    wickets_in_hand = max(0, 10 - wickets_fallen)
    overs_completed = legal_balls_bowled / 6.0
    balls_remaining = max(0, 120 - legal_balls_bowled)
    current_run_rate = round(current_score / overs_completed, 2) if overs_completed > 0 else 0.0
    runs_required = max(0, int(target - current_score))
    overs_rem = balls_remaining / 6.0
    required_run_rate = round(runs_required / overs_rem, 2) if overs_rem > 0 else (0.0 if runs_required == 0 else 99.99)
    crr_minus_rrr = round(current_run_rate - required_run_rate, 2)

    df_feat = pd.DataFrame([{
        'batting_team': batting_team,
        'bowling_team': bowling_team,
        'venue': venue,
        'city': city,
        'current_score': current_score,
        'wickets_fallen': wickets_fallen,
        'wickets_in_hand': wickets_in_hand,
        'legal_balls_bowled': legal_balls_bowled,
        'overs_completed': overs_completed,
        'balls_remaining': balls_remaining,
        'current_run_rate': current_run_rate,
        'target': target,
        'runs_required': runs_required,
        'required_run_rate': required_run_rate,
        'crr_minus_rrr': crr_minus_rrr,
        'runs_last_6_balls': runs_last_6,
        'runs_last_30_balls': runs_last_30,
        'wickets_last_30_balls': wickets_last_30,
        'boundaries_so_far': boundaries_so_far,
        'partnership_runs': partnership_runs
    }])

    probas = pipe.predict_proba(df_feat)[0]
    prob_bat_win = round(float(probas[1]), 4)
    prob_bowl_win = round(1.0 - prob_bat_win, 4)

    return prob_bat_win, prob_bowl_win


def start_simulation(match_id: int) -> Dict[str, Any]:
    """Start a new 2nd-innings chase simulation session for the requested match_id."""
    load_simulator_data()
    
    df_m = SIM_DATA['matches']
    match_row = df_m[df_m['id'] == match_id]
    if len(match_row) == 0:
        raise HTTPException(status_code=404, detail=f"Simulatable match ID '{match_id}' not found.")

    row = match_row.iloc[0]
    deliveries = SIM_DATA['inn2_deliveries'].get(match_id, [])
    if not deliveries:
        raise HTTPException(status_code=400, detail=f"Match ID '{match_id}' has no 2nd innings deliveries.")

    batting_team = deliveries[0]['batting_team']
    bowling_team = deliveries[0]['bowling_team']

    inn1_total = SIM_DATA['inn1_totals'].get(match_id, 0)
    target = int(row['target_runs']) if (pd.notnull(row.get('target_runs')) and row['target_runs'] > 0) else inn1_total + 1

    venue = str(row['venue'])
    city = str(row['city']) if pd.notnull(row['city']) else ""

    # Initial probabilities at 0/0 off 0 balls
    p_bat, p_bowl = _compute_live_probabilities(
        batting_team=batting_team, bowling_team=bowling_team, venue=venue, city=city,
        current_score=0, wickets_fallen=0, legal_balls_bowled=0, target=target,
        runs_last_6=0, runs_last_30=0, wickets_last_30=0, boundaries_so_far=0, partnership_runs=0
    )

    sim_id = f"sim_{match_id}_{uuid.uuid4().hex[:8]}"

    session_state = {
        'simulation_id': sim_id,
        'match_id': match_id,
        'season': str(row['season']),
        'date': str(row['date']),
        'venue': venue,
        'city': city,
        'batting_team': batting_team,
        'bowling_team': bowling_team,
        'target': target,
        'deliveries': deliveries,
        'current_step_index': 0,
        'current_score': 0,
        'wickets_fallen': 0,
        'legal_balls_bowled': 0,
        'boundaries_so_far': 0,
        'partnership_runs': 0,
        'recent_runs_hist': [],
        'recent_wickets_hist': [],
        'match_finished': False,
        'actual_winner': str(row['winner']),
        'actual_result': str(row['result']),
        'actual_margin': float(row['result_margin']) if pd.notnull(row.get('result_margin')) else None,
        'latest_prob_bat': p_bat,
        'latest_prob_bowl': p_bowl
    }

    SIMULATION_SESSIONS[sim_id] = session_state

    return {
        'simulation_id': sim_id,
        'match_id': match_id,
        'season': session_state['season'],
        'venue': venue,
        'city': city,
        'batting_team': batting_team,
        'bowling_team': bowling_team,
        'target': target,
        'current_score': 0,
        'wickets_fallen': 0,
        'balls_completed': 0,
        'balls_remaining': 120,
        'current_run_rate': 0.0,
        'required_run_rate': round(target / 20.0, 2),
        'batting_team_win_probability': p_bat,
        'bowling_team_win_probability': p_bowl,
        'simulation_started': True,
        'match_finished': False
    }


def step_simulation(simulation_id: str) -> Dict[str, Any]:
    """Advance the active simulation by EXACTLY ONE delivery."""
    if simulation_id not in SIMULATION_SESSIONS:
        raise HTTPException(status_code=404, detail=f"Simulation session '{simulation_id}' not found. Please start a new simulation.")

    sim = SIMULATION_SESSIONS[simulation_id]

    if sim['match_finished']:
        return {
            'simulation_id': simulation_id,
            'match_id': sim['match_id'],
            'match_finished': True,
            'message': 'Simulation is already finished.',
            'actual_winner': sim['actual_winner'],
            'actual_result': sim['actual_result'],
            'final_score': f"{sim['current_score']}/{sim['wickets_fallen']}",
            'batting_team_win_probability': sim['latest_prob_bat'],
            'bowling_team_win_probability': sim['latest_prob_bowl']
        }

    deliveries = sim['deliveries']
    idx = sim['current_step_index']

    if idx >= len(deliveries):
        sim['match_finished'] = True
        return {
            'simulation_id': simulation_id,
            'match_id': sim['match_id'],
            'match_finished': True,
            'message': 'All second innings deliveries consumed.',
            'actual_winner': sim['actual_winner'],
            'actual_result': sim['actual_result'],
            'final_score': f"{sim['current_score']}/{sim['wickets_fallen']}",
            'batting_team_win_probability': sim['latest_prob_bat'],
            'bowling_team_win_probability': sim['latest_prob_bowl']
        }

    # Fetch current delivery D_i
    d_row = deliveries[idx]
    
    t_runs = int(d_row['total_runs'])
    b_runs = int(d_row['batsman_runs'])
    e_runs = int(d_row['extra_runs'])
    is_w = int(d_row['is_wicket'])
    extras_t = d_row['extras_type']

    # Update state immediately AFTER this ball
    sim['current_score'] += t_runs
    sim['partnership_runs'] += t_runs

    if is_w == 1:
        sim['wickets_fallen'] += 1
        sim['partnership_runs'] = 0

    if b_runs in [4, 6]:
        sim['boundaries_so_far'] += 1

    is_legal = 0 if (pd.notnull(extras_t) and extras_t in ['wides', 'noballs']) else 1
    sim['legal_balls_bowled'] += is_legal

    sim['recent_runs_hist'].append(t_runs)
    sim['recent_wickets_hist'].append(is_w)

    runs_last_6 = sum(sim['recent_runs_hist'][-6:])
    runs_last_30 = sum(sim['recent_runs_hist'][-30:])
    wkts_last_30 = sum(sim['recent_wickets_hist'][-30:])

    # Derived in-match metrics
    curr_score = sim['current_score']
    curr_wickets = sim['wickets_fallen']
    target = sim['target']
    legal_balls = sim['legal_balls_bowled']
    balls_rem = max(0, 120 - legal_balls)
    overs_comp = legal_balls / 6.0

    crr = round(curr_score / overs_comp, 2) if overs_comp > 0 else 0.0
    runs_req = max(0, int(target - curr_score))
    overs_rem = balls_rem / 6.0
    rrr = round(runs_req / overs_rem, 2) if overs_rem > 0 else (0.0 if runs_req == 0 else 99.99)

    # Call ML Live Win Probability model
    p_bat, p_bowl = _compute_live_probabilities(
        batting_team=sim['batting_team'], bowling_team=sim['bowling_team'],
        venue=sim['venue'], city=sim['city'],
        current_score=curr_score, wickets_fallen=curr_wickets,
        legal_balls_bowled=legal_balls, target=target,
        runs_last_6=runs_last_6, runs_last_30=runs_last_30,
        wickets_last_30=wkts_last_30, boundaries_so_far=sim['boundaries_so_far'],
        partnership_runs=sim['partnership_runs']
    )

    sim['latest_prob_bat'] = p_bat
    sim['latest_prob_bowl'] = p_bowl
    sim['current_step_index'] += 1

    # Check match completion criteria
    match_finished = False
    if curr_score >= target or curr_wickets >= 10 or sim['current_step_index'] >= len(deliveries):
        match_finished = True
        sim['match_finished'] = True

    over_display = f"{int(d_row['over'])}.{int(d_row['ball'])}"

    return {
        'simulation_id': simulation_id,
        'match_id': sim['match_id'],
        'delivery_number': idx + 1,
        'over': int(d_row['over']),
        'ball': int(d_row['ball']),
        'over_display': over_display,
        'batter': str(d_row['batter']),
        'bowler': str(d_row['bowler']),
        'runs_off_bat': b_runs,
        'extra_runs': e_runs,
        'extras_type': str(extras_t) if pd.notnull(extras_t) else None,
        'total_runs': t_runs,
        'is_wicket': bool(is_w),
        'player_dismissed': str(d_row['player_dismissed']) if pd.notnull(d_row.get('player_dismissed')) else None,
        'dismissal_kind': str(d_row['dismissal_kind']) if pd.notnull(d_row.get('dismissal_kind')) else None,
        'current_score': curr_score,
        'wickets_fallen': curr_wickets,
        'overs_completed': round(overs_comp, 2),
        'balls_remaining': balls_rem,
        'target': target,
        'runs_required': runs_req,
        'current_run_rate': crr,
        'required_run_rate': rrr,
        'batting_team_win_probability': p_bat,
        'bowling_team_win_probability': p_bowl,
        'match_finished': match_finished,
        'actual_winner': sim['actual_winner'] if match_finished else None,
        'actual_result': sim['actual_result'] if match_finished else None
    }


def reset_simulation(simulation_id: str) -> Dict[str, Any]:
    """Reset simulation session back to initial state before ball 1."""
    if simulation_id not in SIMULATION_SESSIONS:
        raise HTTPException(status_code=404, detail=f"Simulation session '{simulation_id}' not found.")

    sim = SIMULATION_SESSIONS[simulation_id]

    sim['current_step_index'] = 0
    sim['current_score'] = 0
    sim['wickets_fallen'] = 0
    sim['legal_balls_bowled'] = 0
    sim['boundaries_so_far'] = 0
    sim['partnership_runs'] = 0
    sim['recent_runs_hist'] = []
    sim['recent_wickets_hist'] = []
    sim['match_finished'] = False

    # Compute initial probability
    p_bat, p_bowl = _compute_live_probabilities(
        batting_team=sim['batting_team'], bowling_team=sim['bowling_team'],
        venue=sim['venue'], city=sim['city'],
        current_score=0, wickets_fallen=0, legal_balls_bowled=0, target=sim['target'],
        runs_last_6=0, runs_last_30=0, wickets_last_30=0, boundaries_so_far=0, partnership_runs=0
    )

    sim['latest_prob_bat'] = p_bat
    sim['latest_prob_bowl'] = p_bowl

    return {
        'simulation_id': simulation_id,
        'match_id': sim['match_id'],
        'status': 'reset_successful',
        'current_score': 0,
        'wickets_fallen': 0,
        'balls_remaining': 120,
        'batting_team_win_probability': p_bat,
        'bowling_team_win_probability': p_bowl,
        'match_finished': False
    }
