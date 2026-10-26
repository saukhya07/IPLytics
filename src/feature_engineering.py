"""
IPLytics - Feature Engineering Module
Phase 3: Pre-Match Historical Feature Engineering

Strict Rule: NO DATA LEAKAGE.
All features in this module are computed chronologically using ONLY data
from matches played BEFORE the current match.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Any


def build_pre_match_features(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Build chronological pre-match features for all completed matches.
    
    Features created (all strictly prior to the current match date):
    - team1_historical_win_rate
    - team2_historical_win_rate
    - team1_recent_form_5 (win % in last 5 completed matches)
    - team2_recent_form_5 (win % in last 5 completed matches)
    - h2h_team1_wins
    - h2h_team2_wins
    - h2h_team1_win_rate
    - team1_venue_win_rate
    - team2_venue_win_rate
    - venue_avg_first_innings_score_historical
    """
    df_m = df_matches.sort_values(by=['date', 'id']).reset_index(drop=True)
    
    # Calculate 1st innings totals for historical venue average 1st inn score
    inn1_totals = df_deliveries[df_deliveries['inning'] == 1].groupby('match_id')['total_runs'].sum().to_dict()
    
    records = []
    
    # Track historical match outcomes chronologically
    team_history = {}      # team -> list of bool (True for win, False for loss)
    h2h_history = {}       # tuple(sorted(t1, t2)) -> list of winner team names
    venue_history = {}     # venue -> list of 1st inn scores
    venue_team_history = {}# (venue, team) -> list of bool (True for win, False for loss)

    for idx, row in df_m.iterrows():
        m_id = row['id']
        t1 = row['team1']
        t2 = row['team2']
        venue = row['venue']
        winner = row['winner']
        result = row['result']
        
        # 1. Historical Win Rate prior to current match
        t1_hist = team_history.get(t1, [])
        t2_hist = team_history.get(t2, [])
        
        t1_win_rate = float(np.mean(t1_hist)) if len(t1_hist) > 0 else 0.50
        t2_win_rate = float(np.mean(t2_hist)) if len(t2_hist) > 0 else 0.50
        
        # 2. Recent Form (last 5 completed matches)
        t1_recent = t1_hist[-5:] if len(t1_hist) >= 5 else t1_hist
        t2_recent = t2_hist[-5:] if len(t2_hist) >= 5 else t2_hist
        
        t1_form = float(np.mean(t1_recent)) if len(t1_recent) > 0 else 0.50
        t2_form = float(np.mean(t2_recent)) if len(t2_recent) > 0 else 0.50
        
        # 3. Head-to-Head prior to current match
        pair_key = tuple(sorted([t1, t2]))
        h2h_list = h2h_history.get(pair_key, [])
        
        h2h_t1_wins = sum(1 for w in h2h_list if w == t1)
        h2h_t2_wins = sum(1 for w in h2h_list if w == t2)
        h2h_total = len(h2h_list)
        h2h_t1_win_rate = (h2h_t1_wins / h2h_total) if h2h_total > 0 else 0.50
        
        # 4. Venue Win Rate prior to current match
        v_t1_hist = venue_team_history.get((venue, t1), [])
        v_t2_hist = venue_team_history.get((venue, t2), [])
        
        t1_venue_win_rate = float(np.mean(v_t1_hist)) if len(v_t1_hist) > 0 else t1_win_rate
        t2_venue_win_rate = float(np.mean(v_t2_hist)) if len(v_t2_hist) > 0 else t2_win_rate
        
        # 5. Venue Historical Avg 1st Innings Score
        v_scores = venue_history.get(venue, [])
        v_avg_1st_inn = float(np.mean(v_scores)) if len(v_scores) > 0 else 160.0
        
        rec = {
            'match_id': m_id,
            'season': row['season'],
            'date': row['date'],
            'venue': venue,
            'city': row['city'],
            'team1': t1,
            'team2': t2,
            'toss_winner': row['toss_winner'],
            'toss_decision': row['toss_decision'],
            'team1_historical_win_rate': round(t1_win_rate, 4),
            'team2_historical_win_rate': round(t2_win_rate, 4),
            'team1_recent_form_5': round(t1_form, 4),
            'team2_recent_form_5': round(t2_form, 4),
            'h2h_team1_wins': h2h_t1_wins,
            'h2h_team2_wins': h2h_t2_wins,
            'h2h_total_matches': h2h_total,
            'h2h_team1_win_rate': round(h2h_t1_win_rate, 4),
            'team1_venue_win_rate': round(t1_venue_win_rate, 4),
            'team2_venue_win_rate': round(t2_venue_win_rate, 4),
            'venue_avg_first_innings_score_historical': round(v_avg_1st_inn, 2),
            'winner': winner,
            'result': result
        }
        records.append(rec)
        
        # Update historical state AFTER computing features for current match
        if pd.notnull(winner) and winner in [t1, t2]:
            is_t1_win = (winner == t1)
            is_t2_win = (winner == t2)
            
            team_history.setdefault(t1, []).append(is_t1_win)
            team_history.setdefault(t2, []).append(is_t2_win)
            
            h2h_history.setdefault(pair_key, []).append(winner)
            
            venue_team_history.setdefault((venue, t1), []).append(is_t1_win)
            venue_team_history.setdefault((venue, t2), []).append(is_t2_win)
            
        if m_id in inn1_totals:
            venue_history.setdefault(venue, []).append(inn1_totals[m_id])
            
    return pd.DataFrame(records)


def build_pre_match_player_features(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Build chronological pre-match player features for Player of the Match prediction.
    Features for each player involved in a match are computed strictly using matches
    played BEFORE the target match.
    """
    df_m = df_matches.sort_values(by=['date', 'id']).reset_index(drop=True)
    
    # Pre-index deliveries by match_id for fast lookup
    del_by_match = {m_id: group for m_id, group in df_deliveries.groupby('match_id')}
    
    # Historical player stat trackers
    player_bat_runs = {}
    player_bat_balls = {}
    player_bowl_wickets = {}
    player_bowl_balls = {}
    player_bowl_runs = {}
    player_pom_count = {}
    player_recent_bat_runs = {} # list of runs in last 5 matches
    player_recent_bowl_wkts = {} # list of wickets in last 5 matches

    records = []
    
    bowler_dismissals = {'caught', 'bowled', 'lbw', 'stumped', 'caught and bowled', 'hit wicket'}

    for idx, row in df_m.iterrows():
        m_id = row['id']
        date = row['date']
        season = row['season']
        pom = row['player_of_match']
        
        if m_id not in del_by_match:
            continue
            
        d_m = del_by_match[m_id]
        
        # Identify playing players in this match
        match_batters = set(d_m['batter']).union(set(d_m['non_striker']))
        match_bowlers = set(d_m['bowler'])
        playing_players = sorted(list(match_batters.union(match_bowlers)))
        
        for player in playing_players:
            # Historical pre-match stats
            cum_runs = player_bat_runs.get(player, 0)
            cum_balls = player_bat_balls.get(player, 0)
            cum_wkts = player_bowl_wickets.get(player, 0)
            cum_bowl_balls = player_bowl_balls.get(player, 0)
            cum_bowl_runs = player_bowl_runs.get(player, 0)
            cum_poms = player_pom_count.get(player, 0)
            
            sr = (cum_runs / cum_balls * 100.0) if cum_balls > 0 else 0.0
            econ = (cum_runs / (cum_bowl_balls / 6.0)) if cum_bowl_balls > 0 else 0.0
            
            rec_runs = player_recent_bat_runs.get(player, [])[-5:]
            rec_wkts = player_recent_bowl_wkts.get(player, [])[-5:]
            
            avg_recent_runs = float(np.mean(rec_runs)) if len(rec_runs) > 0 else 0.0
            avg_recent_wkts = float(np.mean(rec_wkts)) if len(rec_wkts) > 0 else 0.0
            
            is_pom = 1 if (pd.notnull(pom) and player == pom) else 0
            
            records.append({
                'match_id': m_id,
                'season': season,
                'date': date,
                'player': player,
                'hist_runs': cum_runs,
                'hist_balls_faced': cum_balls,
                'hist_strike_rate': round(sr, 2),
                'hist_wickets': cum_wkts,
                'hist_balls_bowled': cum_bowl_balls,
                'hist_runs_conceded': cum_bowl_runs,
                'hist_economy': round(econ, 2),
                'hist_pom_count': cum_poms,
                'recent_avg_runs_5': round(avg_recent_runs, 2),
                'recent_avg_wickets_5': round(avg_recent_wkts, 2),
                'is_player_of_match': is_pom
            })
            
        # UPDATE historical stats AFTER computing for current match
        for p_bat, group in d_m.groupby('batter'):
            r_scored = int(group['batsman_runs'].sum())
            b_faced = int((group['extras_type'] != 'wides').sum())
            player_bat_runs[p_bat] = player_bat_runs.get(p_bat, 0) + r_scored
            player_bat_balls[p_bat] = player_bat_balls.get(p_bat, 0) + b_faced
            player_recent_bat_runs.setdefault(p_bat, []).append(r_scored)
            
        for p_bowl, group in d_m.groupby('bowler'):
            w_taken = int(((group['is_wicket'] == 1) & (group['dismissal_kind'].isin(bowler_dismissals))).sum())
            b_bowled = int((~group['extras_type'].isin(['wides', 'noballs'])).sum())
            r_conceded = int(group[~group['extras_type'].isin(['byes', 'legbyes', 'penalty'])]['total_runs'].sum())
            
            player_bowl_wickets[p_bowl] = player_bowl_wickets.get(p_bowl, 0) + w_taken
            player_bowl_balls[p_bowl] = player_bowl_balls.get(p_bowl, 0) + b_bowled
            player_bowl_runs[p_bowl] = player_bowl_runs.get(p_bowl, 0) + r_conceded
            player_recent_bowl_wkts.setdefault(p_bowl, []).append(w_taken)
            
        if pd.notnull(pom):
            player_pom_count[pom] = player_pom_count.get(pom, 0) + 1
            
    return pd.DataFrame(records)
