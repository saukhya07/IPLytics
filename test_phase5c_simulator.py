"""
IPLytics - Phase 5C Verification & Regression Test Suite
Tests:
1. GET /health
2. GET /simulator/matches
3. POST /simulator/start/{match_id}
4. POST /simulator/{simulation_id}/step (at least 15 consecutive real deliveries)
5. Live probability changes & verification with actual delivery metrics
6. POST /simulator/{simulation_id}/reset
7. Phase 5A Regression (all 4 ML prediction endpoints)
8. Phase 5B Regression (/teams, /players, /head-to-head)
"""

import sys
import os
import json
from fastapi.testclient import TestClient

# Ensure root path is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.main import app

client = TestClient(app)

def test_phase5c_pipeline():
    print("=" * 70)
    print("RUNNING PHASE 5C VERIFICATION & REGRESSION TEST SUITE")
    print("=" * 70)

    # 1. Health check
    res_health = client.get("/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    health_data = res_health.json()
    print(f"1. GET /health: {health_data['status']} (models_loaded={health_data['models_loaded']})")
    assert health_data['models_loaded'] is True

    # 2. Get simulatable matches
    res_sim_matches = client.get("/simulator/matches?limit=10")
    assert res_sim_matches.status_code == 200, f"Get simulator matches failed: {res_sim_matches.text}"
    matches_data = res_sim_matches.json()
    assert matches_data['count'] > 0
    print(f"2. GET /simulator/matches: Found {matches_data['count']} simulatable matches.")
    
    # Pick a real match (e.g. first match in list)
    target_match = matches_data['matches'][0]
    match_id = target_match['match_id']
    print(f"   Selected Match ID {match_id}: {target_match['team1']} vs {target_match['team2']} ({target_match['season']}, Venue: {target_match['venue']})")
    print(f"   Target: {target_match['target_runs']} runs")

    # 3. Start simulation
    res_start = client.post(f"/simulator/start/{match_id}")
    assert res_start.status_code == 200, f"Start simulation failed: {res_start.text}"
    start_data = res_start.json()
    sim_id = start_data['simulation_id']
    print(f"3. POST /simulator/start/{match_id}: Simulation ID '{sim_id}' created.")
    print(f"   Initial State: Score={start_data['current_score']}/{start_data['wickets_fallen']}, "
          f"Prob(Bat: {start_data['batting_team']})={start_data['batting_team_win_probability']:.4f}, "
          f"Prob(Bowl: {start_data['bowling_team']})={start_data['bowling_team_win_probability']:.4f}")

    # 4. Advance 15 deliveries and track state & probability progression
    print("\n4. Stepping through 15 real historical deliveries...")
    print("-" * 70)
    print(f"{'Step':<5} | {'Ball':<6} | {'Batter':<15} | {'Bowler':<15} | {'Runs':<5} | {'Wkt':<4} | {'Score':<8} | {'RRR':<6} | {'Win Prob (Batting)':<18}")
    print("-" * 70)

    prob_history = []
    
    for step in range(1, 16):
        res_step = client.post(f"/simulator/{sim_id}/step")
        assert res_step.status_code == 200, f"Step {step} failed: {res_step.text}"
        step_data = res_step.json()
        
        prob_bat = step_data['batting_team_win_probability']
        prob_history.append(prob_bat)
        
        wkt_str = "YES" if step_data['is_wicket'] else "No"
        print(f"{step:<5} | {step_data['over_display']:<6} | {step_data['batter'][:15]:<15} | {step_data['bowler'][:15]:<15} | "
              f"{step_data['total_runs']:<5} | {wkt_str:<4} | {step_data['current_score']}/{step_data['wickets_fallen']:<6} | "
              f"{step_data['required_run_rate']:<6.2f} | {prob_bat:.4f} ({prob_bat*100:.1f}%)")
        
        # Verify score and over tracking
        assert step_data['delivery_number'] == step
        assert 0.0 <= prob_bat <= 1.0

    print("-" * 70)
    print(f"Probability progression across first 15 balls: {[round(p, 4) for p in prob_history]}")
    
    # Verify probability changes dynamically across states
    assert len(set(prob_history)) > 1, "Win probabilities must not be static!"

    # 5. Test Reset
    print("\n5. Testing Reset endpoint...")
    res_reset = client.post(f"/simulator/{sim_id}/reset")
    assert res_reset.status_code == 200, f"Reset failed: {res_reset.text}"
    reset_data = res_reset.json()
    assert reset_data['current_score'] == 0
    assert reset_data['wickets_fallen'] == 0
    assert reset_data['balls_remaining'] == 120
    print(f"   [PASS] Reset successful for '{sim_id}'. Score reset to 0/0 off 0 balls.")
    
    # Step again after reset to confirm restarting from ball 1
    res_step_after_reset = client.post(f"/simulator/{sim_id}/step")
    assert res_step_after_reset.status_code == 200
    step_after_reset = res_step_after_reset.json()
    assert step_after_reset['delivery_number'] == 1
    print(f"   [PASS] Re-started simulation. Ball 1 delivery number = {step_after_reset['delivery_number']}.")

    # 6. Phase 5A Regression Tests
    print("\n6. Phase 5A Regression Tests (ML Endpoints)...")
    
    # 6a. Match Winner
    mw_payload = {
        "team1": "Chennai Super Kings", "team2": "Mumbai Indians",
        "venue": "MA Chidambaram Stadium, Chepauk", "city": "Chennai",
        "toss_winner": "Chennai Super Kings", "toss_decision": "field",
        "team1_historical_win_rate": 0.58, "team2_historical_win_rate": 0.55,
        "team1_recent_form_5": 0.60, "team2_recent_form_5": 0.40,
        "h2h_team1_wins": 15, "h2h_team2_wins": 20, "h2h_total_matches": 35,
        "h2h_team1_win_rate": 0.428, "team1_venue_win_rate": 0.65,
        "team2_venue_win_rate": 0.45, "venue_avg_first_innings_score_historical": 165.0
    }
    res_mw = client.post("/predict/match-winner", json=mw_payload)
    assert res_mw.status_code == 200, f"Match winner prediction failed: {res_mw.text}"
    print(f"   - Match Winner: Predicted '{res_mw.json()['predicted_winner']}'")

    # 6b. Live Win Probability
    lwp_payload = {
        "batting_team": "Chennai Super Kings", "bowling_team": "Mumbai Indians",
        "venue": "Wankhede Stadium", "city": "Mumbai", "current_score": 140,
        "wickets_fallen": 3, "legal_balls_bowled": 90, "target": 180.0,
        "runs_last_6_balls": 10, "runs_last_30_balls": 45, "wickets_last_30_balls": 1,
        "boundaries_so_far": 12, "partnership_runs": 35
    }
    res_lwp = client.post("/predict/live-win-probability", json=lwp_payload)
    assert res_lwp.status_code == 200, f"Live win prob prediction failed: {res_lwp.text}"
    print(f"   - Live Win Prob: Batting Win Prob = {res_lwp.json()['batting_team_win_probability']}")

    # 6c. Score Prediction
    sp_payload = {
        "batting_team": "Mumbai Indians", "bowling_team": "Sunrisers Hyderabad",
        "venue": "Wankhede Stadium", "city": "Mumbai", "current_score": 120,
        "wickets_fallen": 2, "legal_balls_bowled": 80, "runs_last_6_balls": 8,
        "runs_last_30_balls": 40, "wickets_last_30_balls": 1, "boundaries_so_far": 10,
        "partnership_runs": 25
    }
    res_sp = client.post("/predict/score", json=sp_payload)
    assert res_sp.status_code == 200, f"Score prediction failed: {res_sp.text}"
    print(f"   - Score Prediction: Predicted Final Score = {res_sp.json()['predicted_final_score']}")

    # 6d. Player of Match
    pom_payload = {
        "player": "V Kohli", "hist_runs": 8000, "hist_balls_faced": 6000,
        "hist_strike_rate": 132.0, "hist_wickets": 4, "hist_balls_bowled": 150,
        "hist_runs_conceded": 200, "hist_economy": 8.0, "hist_pom_count": 18,
        "recent_avg_runs_5": 45.0, "recent_avg_wickets_5": 0.0
    }
    res_pom = client.post("/predict/player-of-match", json=pom_payload)
    assert res_pom.status_code == 200, f"Player of match failed: {res_pom.text}"
    print(f"   - Player of Match: Predicted POM Candidate = '{res_pom.json()['predicted_player']}'")

    # 7. Phase 5B Regression Tests
    print("\n7. Phase 5B Regression Tests (Analytics Endpoints)...")
    res_teams = client.get("/teams")
    assert res_teams.status_code == 200
    print(f"   - /teams: {len(res_teams.json()['teams'])} teams")

    res_players = client.get("/players?limit=5")
    assert res_players.status_code == 200
    print(f"   - /players: Returned {res_players.json()['count']} players")

    res_h2h = client.get("/head-to-head/Chennai%20Super%20Kings/Mumbai%20Indians")
    assert res_h2h.status_code == 200
    h2h_d = res_h2h.json()
    print(f"   - /head-to-head: CSK vs MI Total Matches = {h2h_d['total_matches']} (CSK {h2h_d['team1_wins']} - {h2h_d['team2_wins']} MI)")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("PHASE 5C COMPLETE — HISTORICAL ML SIMULATOR READY")
    print("=" * 70)

if __name__ == '__main__':
    test_phase5c_pipeline()
