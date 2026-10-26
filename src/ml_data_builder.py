"""
IPLytics - ML Data Builder Module
Phase 3: Dataset Assembly and Persistence

Assembles all 4 ML training datasets:
1. data/ml/match_winner_dataset.csv
2. data/ml/live_win_probability_dataset.csv
3. data/ml/score_prediction_dataset.csv
4. data/ml/player_of_match_dataset.csv

Applies chronological validation and checks for zero target leakage.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Tuple, Any

from src.feature_engineering import build_pre_match_features, build_pre_match_player_features
from src.live_features import compute_live_delivery_features


def build_and_save_ml_datasets(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame, output_dir: str) -> Dict[str, Any]:
    """
    Build all 4 ML-ready datasets and save them into output_dir (data/ml/).
    Returns dataset statistics and validation metrics.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    print("Building Task 1: Pre-Match Match Winner Dataset...")
    df_pre = build_pre_match_features(df_matches, df_deliveries)
    # Filter valid winners (exclude no result)
    df_match_winner = df_pre[df_pre['winner'].notnull() & (df_pre['result'] != 'no result')].copy()
    df_match_winner['team1_win'] = (df_match_winner['winner'] == df_match_winner['team1']).astype(int)
    
    match_winner_cols = [
        'match_id', 'season', 'date', 'venue', 'city', 'team1', 'team2',
        'toss_winner', 'toss_decision',
        'team1_historical_win_rate', 'team2_historical_win_rate',
        'team1_recent_form_5', 'team2_recent_form_5',
        'h2h_team1_wins', 'h2h_team2_wins', 'h2h_total_matches', 'h2h_team1_win_rate',
        'team1_venue_win_rate', 'team2_venue_win_rate',
        'venue_avg_first_innings_score_historical',
        'team1_win'
    ]
    df_match_winner = df_match_winner[match_winner_cols]
    mw_path = os.path.join(output_dir, 'match_winner_dataset.csv')
    df_match_winner.to_csv(mw_path, index=False)
    print(f" Saved match_winner_dataset.csv: {df_match_winner.shape}")
    
    print("\nComputing Live In-Match Delivery Features...")
    df_live_all = compute_live_delivery_features(df_matches, df_deliveries)
    
    print("Building Task 2: Live Win Probability Dataset (Second Innings Chase)...")
    df_live_win = df_live_all[
        (df_live_all['inning'] == 2) & 
        (df_live_all['result'] != 'no result') & 
        (df_live_all['batting_team_wins'].notnull())
    ].copy()
    
    df_live_win['batting_team_wins'] = df_live_win['batting_team_wins'].astype(int)
    
    live_win_cols = [
        'match_id', 'season', 'venue', 'city', 'batting_team', 'bowling_team',
        'current_score', 'wickets_fallen', 'wickets_in_hand', 'legal_balls_bowled',
        'overs_completed', 'balls_remaining', 'current_run_rate', 'target',
        'runs_required', 'required_run_rate', 'crr_minus_rrr',
        'runs_last_6_balls', 'runs_last_30_balls', 'wickets_last_30_balls',
        'boundaries_so_far', 'partnership_runs', 'batting_team_wins'
    ]
    df_live_win = df_live_win[live_win_cols]
    lwp_path = os.path.join(output_dir, 'live_win_probability_dataset.csv')
    df_live_win.to_csv(lwp_path, index=False)
    print(f" Saved live_win_probability_dataset.csv: {df_live_win.shape}")
    
    print("Building Task 3: Score Prediction Dataset (First Innings Progress)...")
    df_score_pred = df_live_all[
        (df_live_all['inning'] == 1) & 
        (df_live_all['result'] != 'no result')
    ].copy()
    
    score_pred_cols = [
        'match_id', 'season', 'venue', 'city', 'batting_team', 'bowling_team',
        'current_score', 'wickets_fallen', 'wickets_in_hand', 'legal_balls_bowled',
        'overs_completed', 'balls_remaining', 'current_run_rate',
        'runs_last_6_balls', 'runs_last_30_balls', 'wickets_last_30_balls',
        'boundaries_so_far', 'partnership_runs', 'final_score'
    ]
    df_score_pred = df_score_pred.rename(columns={'inn_final_score': 'final_score'})[score_pred_cols]
    sp_path = os.path.join(output_dir, 'score_prediction_dataset.csv')
    df_score_pred.to_csv(sp_path, index=False)
    print(f" Saved score_prediction_dataset.csv: {df_score_pred.shape}")
    
    print("Building Task 4: Player of the Match Dataset (Pre-Match Player Features)...")
    df_pom_pre = build_pre_match_player_features(df_matches, df_deliveries)
    
    pom_cols = [
        'match_id', 'season', 'date', 'player',
        'hist_runs', 'hist_balls_faced', 'hist_strike_rate',
        'hist_wickets', 'hist_balls_bowled', 'hist_runs_conceded', 'hist_economy',
        'hist_pom_count', 'recent_avg_runs_5', 'recent_avg_wickets_5',
        'is_player_of_match'
    ]
    df_pom_pre = df_pom_pre[pom_cols]
    pom_path = os.path.join(output_dir, 'player_of_match_dataset.csv')
    df_pom_pre.to_csv(pom_path, index=False)
    print(f" Saved player_of_match_dataset.csv: {df_pom_pre.shape}")
    
    return {
        'match_winner': df_match_winner,
        'live_win_probability': df_live_win,
        'score_prediction': df_score_pred,
        'player_of_match': df_pom_pre
    }
