"""
IPLytics - Player Statistics Module
Phase 2: Batting and Bowling Analysis

Provides reusable functions to calculate player batting stats, bowling stats,
leaderboards, and generate data/processed/player_statistics.csv.
"""

import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

BOWLER_DISMISSALS = ['caught', 'bowled', 'lbw', 'stumped', 'caught and bowled', 'hit wicket']


def calculate_batting_statistics(df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate comprehensive batting statistics for all batters:
    - Runs, Balls faced (excluding wides), Strike rate, Fours, Sixes, 50s, 100s, Innings played, Batting Average.
    """
    # Exclude wide balls from balls faced by batter
    legit_balls = df_deliveries[df_deliveries['extras_type'] != 'wides']
    
    total_runs = df_deliveries.groupby('batter')['batsman_runs'].sum()
    balls_faced = legit_balls.groupby('batter').size()
    fours = df_deliveries[df_deliveries['batsman_runs'] == 4].groupby('batter').size()
    sixes = df_deliveries[df_deliveries['batsman_runs'] == 6].groupby('batter').size()
    
    # Inning-level runs for 50s and 100s
    inn_runs = df_deliveries.groupby(['match_id', 'inning', 'batter'])['batsman_runs'].sum().reset_index()
    fifties = inn_runs[(inn_runs['batsman_runs'] >= 50) & (inn_runs['batsman_runs'] < 100)].groupby('batter').size()
    hundreds = inn_runs[inn_runs['batsman_runs'] >= 100].groupby('batter').size()
    highest_scores = inn_runs.groupby('batter')['batsman_runs'].max()
    innings_count = inn_runs.groupby('batter').size()
    
    # Dismissals count
    dismissals = df_deliveries[df_deliveries['player_dismissed'].notnull()].groupby('player_dismissed').size()
    
    df_bat = pd.DataFrame({
        'runs': total_runs,
        'balls': balls_faced,
        'innings': innings_count,
        'highest_score': highest_scores,
        'fours': fours,
        'sixes': sixes,
        'fifties': fifties,
        'hundreds': hundreds,
        'dismissals': dismissals
    }).fillna(0).astype(int)
    
    df_bat['strike_rate'] = np.where(df_bat['balls'] > 0, (df_bat['runs'] / df_bat['balls']) * 100, 0.0).round(2)
    df_bat['batting_average'] = np.where(df_bat['dismissals'] > 0, df_bat['runs'] / df_bat['dismissals'], df_bat['runs'].astype(float)).round(2)
    
    df_bat = df_bat.reset_index()
    if 'batter' in df_bat.columns:
        df_bat = df_bat.rename(columns={'batter': 'player'})
    elif 'index' in df_bat.columns:
        df_bat = df_bat.rename(columns={'index': 'player'})
    return df_bat


def calculate_bowling_statistics(df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate comprehensive bowling statistics for all bowlers:
    - Wickets (bowler credited only), Legal balls bowled, Overs, Runs conceded, Economy, Bowling average, 4W, 5W.
    """
    # Filter for bowler-credited wickets
    bowler_wickets_df = df_deliveries[
        (df_deliveries['is_wicket'] == 1) & 
        (df_deliveries['dismissal_kind'].isin(BOWLER_DISMISSALS))
    ]
    wickets = bowler_wickets_df.groupby('bowler').size()
    
    # Legal balls bowled (exclude wides and noballs)
    legal_balls = df_deliveries[~df_deliveries['extras_type'].isin(['wides', 'noballs'])].groupby('bowler').size()
    
    # Runs conceded (exclude byes, legbyes, penalty)
    runs_conceded = df_deliveries[~df_deliveries['extras_type'].isin(['byes', 'legbyes', 'penalty'])].groupby('bowler')['total_runs'].sum()
    
    # Inning-level wickets for 4W and 5W
    inn_wickets = bowler_wickets_df.groupby(['match_id', 'inning', 'bowler']).size().reset_index(name='wickets')
    four_w = inn_wickets[inn_wickets['wickets'] == 4].groupby('bowler').size()
    five_w = inn_wickets[inn_wickets['wickets'] >= 5].groupby('bowler').size()
    inn_count = df_deliveries.groupby(['match_id', 'inning', 'bowler']).size().reset_index().groupby('bowler').size()
    
    df_bowl = pd.DataFrame({
        'wickets': wickets,
        'balls_bowled': legal_balls,
        'runs_conceded': runs_conceded,
        'four_w': four_w,
        'five_w': five_w,
        'bowling_innings': inn_count
    }).fillna(0).astype(int)
    
    df_bowl['overs'] = (df_bowl['balls_bowled'] / 6.0).round(1)
    df_bowl['economy'] = np.where(df_bowl['balls_bowled'] > 0, (df_bowl['runs_conceded'] / df_bowl['balls_bowled']) * 6.0, 0.0).round(2)
    df_bowl['bowling_average'] = np.where(df_bowl['wickets'] > 0, df_bowl['runs_conceded'] / df_bowl['wickets'], np.nan).round(2)
    
    df_bowl = df_bowl.reset_index()
    if 'bowler' in df_bowl.columns:
        df_bowl = df_bowl.rename(columns={'bowler': 'player'})
    elif 'index' in df_bowl.columns:
        df_bowl = df_bowl.rename(columns={'index': 'player'})
    return df_bowl


def generate_player_statistics_dataset(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Generate unified player_statistics.csv dataframe combining batting, bowling, and total match appearances.
    """
    batting_df = calculate_batting_statistics(df_deliveries)
    bowling_df = calculate_bowling_statistics(df_deliveries)
    
    # Get total match appearances
    batters_m = set(df_deliveries['batter']).union(set(df_deliveries['non_striker']))
    bowlers_m = set(df_deliveries['bowler'])
    
    match_appearances = {}
    for p in batters_m.union(bowlers_m):
        m_ids = df_deliveries[(df_deliveries['batter'] == p) | (df_deliveries['non_striker'] == p) | (df_deliveries['bowler'] == p)]['match_id'].nunique()
        match_appearances[p] = m_ids
        
    df_matches_count = pd.DataFrame(list(match_appearances.items()), columns=['player', 'matches'])
    
    # Merge datasets
    merged = pd.merge(df_matches_count, batting_df, on='player', how='left')
    merged = pd.merge(merged, bowling_df, on='player', how='left')
    
    # Fill NAs
    int_cols = ['runs', 'balls', 'fours', 'sixes', 'fifties', 'hundreds', 'wickets', 'balls_bowled', 'runs_conceded', 'four_w', 'five_w']
    for col in int_cols:
        merged[col] = merged[col].fillna(0).astype(int)
        
    merged['strike_rate'] = merged['strike_rate'].fillna(0.0)
    merged['economy'] = merged['economy'].fillna(0.0)
    
    final_cols = [
        'player', 'matches', 'runs', 'balls', 'strike_rate', 'fours', 'sixes',
        'fifties', 'hundreds', 'wickets', 'balls_bowled', 'runs_conceded',
        'economy', 'bowling_average'
    ]
    
    return merged[final_cols].sort_values(by=['runs', 'wickets'], ascending=False)
