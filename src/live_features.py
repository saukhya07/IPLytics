"""
IPLytics - Live Features Module
Phase 3: Live In-Match Feature Engineering

Calculates exact match state immediately AFTER each delivery for:
1. Live Win Probability Dataset (Second Innings Chase)
2. Score Prediction Dataset (Innings Progress)

Strict Rule: NO DATA LEAKAGE.
All features represent the state immediately AFTER each delivery. Future delivery
results are strictly hidden.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Any


def compute_live_delivery_features(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Compute ball-by-ball in-match states for all match innings.
    Returns a unified DataFrame with live features calculated for every delivery.
    """
    # Create target_runs lookup from matches
    m_info = df_matches.set_index('id')
    
    # Calculate 1st innings totals for fallback target calculation
    inn1_totals = df_deliveries[df_deliveries['inning'] == 1].groupby('match_id')['total_runs'].sum().to_dict()
    
    del_records = []
    
    # Process deliveries match by match to maintain speed and exact state
    for m_id, m_del in df_deliveries.groupby('match_id', sort=False):
        if m_id not in m_info.index:
            continue
            
        m_row = m_info.loc[m_id]
        match_winner = m_row['winner']
        match_result = m_row['result']
        venue = m_row['venue']
        city = m_row['city']
        season = m_row['season']
        
        # Target for 2nd innings
        if pd.notnull(m_row.get('target_runs')) and m_row['target_runs'] > 0:
            target_2nd_inn = int(m_row['target_runs'])
        elif m_id in inn1_totals:
            target_2nd_inn = inn1_totals[m_id] + 1
        else:
            target_2nd_inn = np.nan

        # Process each inning in the match
        for inn_num, inn_del in m_del.groupby('inning', sort=False):
            if inn_num not in [1, 2]:
                continue # Skip super overs for standard innings datasets
                
            curr_score = 0
            curr_wickets = 0
            legal_balls_bowled = 0
            boundaries_cnt = 0
            curr_partnership = 0
            
            recent_runs_hist = []    # history of total_runs per delivery
            recent_wickets_hist = [] # history of is_wicket per delivery
            
            batting_team = inn_del['batting_team'].iloc[0]
            bowling_team = inn_del['bowling_team'].iloc[0]
            
            # Winner logic for target
            if pd.notnull(match_winner):
                batting_team_wins = 1 if match_winner == batting_team else 0
            else:
                batting_team_wins = np.nan
                
            # Innings total score for regression target
            inn_final_score = int(inn_del['total_runs'].sum())

            for _, d_row in inn_del.iterrows():
                t_runs = int(d_row['total_runs'])
                b_runs = int(d_row['batsman_runs'])
                is_w = int(d_row['is_wicket'])
                extras_t = d_row['extras_type']
                
                # Update state immediately AFTER this ball
                curr_score += t_runs
                curr_partnership += t_runs
                
                if is_w == 1:
                    curr_wickets += 1
                    curr_partnership = 0 # reset partnership
                    
                if b_runs in [4, 6]:
                    boundaries_cnt += 1
                    
                is_legal = 0 if extras_t in ['wides', 'noballs'] else 1
                legal_balls_bowled += is_legal
                
                recent_runs_hist.append(t_runs)
                recent_wickets_hist.append(is_w)
                
                # Derived live metrics
                wickets_in_hand = max(0, 10 - curr_wickets)
                overs_completed = legal_balls_bowled / 6.0
                balls_remaining = max(0, 120 - legal_balls_bowled)
                
                crr = round(curr_score / overs_completed, 2) if overs_completed > 0 else 0.0
                
                # Recent window features (last 6 and last 30 delivery rows)
                runs_last_6 = sum(recent_runs_hist[-6:])
                runs_last_30 = sum(recent_runs_hist[-30:])
                wkts_last_30 = sum(recent_wickets_hist[-30:])
                
                # 2nd innings specific metrics
                if inn_num == 2 and pd.notnull(target_2nd_inn):
                    target_val = target_2nd_inn
                    runs_req = max(0, int(target_val - curr_score))
                    overs_rem = balls_remaining / 6.0
                    
                    if overs_rem > 0:
                        rrr = round(runs_req / overs_rem, 2)
                    else:
                        rrr = 0.0 if runs_req == 0 else 99.99
                        
                    crr_minus_rrr = round(crr - rrr, 2)
                else:
                    target_val = np.nan
                    runs_req = np.nan
                    rrr = np.nan
                    crr_minus_rrr = np.nan
                    
                del_records.append({
                    'match_id': m_id,
                    'season': season,
                    'venue': venue,
                    'city': city,
                    'inning': inn_num,
                    'batting_team': batting_team,
                    'bowling_team': bowling_team,
                    'over': int(d_row['over']),
                    'ball': int(d_row['ball']),
                    'current_score': curr_score,
                    'wickets_fallen': curr_wickets,
                    'wickets_in_hand': wickets_in_hand,
                    'legal_balls_bowled': legal_balls_bowled,
                    'overs_completed': round(overs_completed, 2),
                    'balls_remaining': balls_remaining,
                    'current_run_rate': crr,
                    'target': target_val,
                    'runs_required': runs_req,
                    'required_run_rate': rrr,
                    'crr_minus_rrr': crr_minus_rrr,
                    'runs_last_6_balls': runs_last_6,
                    'runs_last_30_balls': runs_last_30,
                    'wickets_last_30_balls': wkts_last_30,
                    'boundaries_so_far': boundaries_cnt,
                    'partnership_runs': curr_partnership,
                    'batting_team_wins': batting_team_wins,
                    'inn_final_score': inn_final_score,
                    'result': match_result
                })
                
    return pd.DataFrame(del_records)
