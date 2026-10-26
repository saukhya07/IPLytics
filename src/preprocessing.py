"""
IPLytics - Data Preprocessing Module
Phase 1: Team Standardization & Data Cleaning

This module handles:
1. Loading raw matches and deliveries data.
2. Standardizing historical team names.
3. Imputing missing data where deterministically possible (e.g. city from venue).
4. Preserving raw records (no silent deletions of ties/DLS/no-result matches).
5. Saving cleaned processed datasets.
"""

import os
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any


TEAM_NAME_MAPPINGS = {
    'Delhi Daredevils': 'Delhi Capitals',
    'Kings XI Punjab': 'Punjab Kings',
    'Royal Challengers Bangalore': 'Royal Challengers Bengaluru',
    'Rising Pune Supergiants': 'Rising Pune Supergiant'
}

VENUE_CITY_MAPPINGS = {
    'Dubai International Cricket Stadium': 'Dubai',
    'Sharjah Cricket Stadium': 'Sharjah'
}


def load_raw_datasets(matches_path: str, deliveries_path: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load raw matches and deliveries datasets."""
    df_matches = pd.read_csv(matches_path)
    df_deliveries = pd.read_csv(deliveries_path)
    return df_matches, df_deliveries


def standardize_team_names(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Standardize historical team names in both matches and deliveries DataFrames.
    Returns modified df_matches, df_deliveries, and a mapping summary DataFrame.
    """
    df_m = df_matches.copy()
    df_d = df_deliveries.copy()
    
    mapping_summary = []
    
    for orig_name, std_name in TEAM_NAME_MAPPINGS.items():
        # Count in matches
        m_t1 = int((df_m['team1'] == orig_name).sum())
        m_t2 = int((df_m['team2'] == orig_name).sum())
        m_tw = int((df_m['toss_winner'] == orig_name).sum())
        m_w = int((df_m['winner'] == orig_name).sum())
        total_matches_affected = int(((df_m['team1'] == orig_name) | (df_m['team2'] == orig_name)).sum())
        
        # Count in deliveries
        d_bat = int((df_d['batting_team'] == orig_name).sum())
        d_bowl = int((df_d['bowling_team'] == orig_name).sum())
        total_deliveries_affected = d_bat + d_bowl
        
        mapping_summary.append({
            'original_name': orig_name,
            'standardized_name': std_name,
            'matches_team1_count': m_t1,
            'matches_team2_count': m_t2,
            'matches_toss_winner_count': m_tw,
            'matches_winner_count': m_w,
            'total_matches_affected': total_matches_affected,
            'deliveries_batting_count': d_bat,
            'deliveries_bowling_count': d_bowl,
            'total_deliveries_affected': total_deliveries_affected
        })
        
        # Apply replacement
        for col in ['team1', 'team2', 'toss_winner', 'winner']:
            if col in df_m.columns:
                df_m[col] = df_m[col].replace(orig_name, std_name)
                
        for col in ['batting_team', 'bowling_team']:
            if col in df_d.columns:
                df_d[col] = df_d[col].replace(orig_name, std_name)
                
    summary_df = pd.DataFrame(mapping_summary)
    return df_m, df_d, summary_df


def clean_matches_data(df_matches: pd.DataFrame) -> pd.DataFrame:
    """
    Perform deterministic cleaning on matches DataFrame:
    1. Impute missing city based on venue (e.g. Dubai, Sharjah).
    2. Strip leading/trailing whitespaces from string columns.
    3. Retain all matches (no deletion of no-result/tied/DLS matches).
    """
    df = df_matches.copy()
    
    # Impute missing city from venue
    mask_null_city = df['city'].isnull()
    for venue, city in VENUE_CITY_MAPPINGS.items():
        df.loc[mask_null_city & (df['venue'] == venue), 'city'] = city
        
    # Strip whitespaces from string columns
    str_cols = df.select_dtypes(include=['object', 'string']).columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({'nan': np.nan, 'None': np.nan})
        
    return df


def clean_deliveries_data(df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Perform deterministic cleaning on deliveries DataFrame:
    1. Strip leading/trailing whitespaces from string columns.
    2. Retain all deliveries without modification of runs or wicket records.
    """
    df = df_deliveries.copy()
    
    str_cols = df.select_dtypes(include=['object', 'string']).columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({'nan': np.nan, 'None': np.nan})
        
    return df


def save_processed_datasets(df_matches_clean: pd.DataFrame, df_deliveries_clean: pd.DataFrame, output_dir: str):
    """Save cleaned DataFrames to processed CSV files."""
    os.makedirs(output_dir, exist_ok=True)
    matches_clean_path = os.path.join(output_dir, 'matches_clean.csv')
    deliveries_clean_path = os.path.join(output_dir, 'deliveries_clean.csv')
    
    df_matches_clean.to_csv(matches_clean_path, index=False)
    df_deliveries_clean.to_csv(deliveries_clean_path, index=False)
    print(f"Saved cleaned datasets to {output_dir}")
