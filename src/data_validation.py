"""
IPLytics - Data Validation Module
Phase 1: Data Inspection & Validation

This module provides reusable functions for loading datasets, checking dimensions,
schema, missing values, duplicates, validating key relationships (match_id),
extracting player entities, and generating data quality reports.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Set, Any


def load_dataset(filepath: str) -> pd.DataFrame:
    """Load a CSV dataset into a pandas DataFrame."""
    return pd.read_csv(filepath)


def get_dataset_shape(df: pd.DataFrame) -> Tuple[int, int]:
    """Return the number of rows and columns in the DataFrame."""
    return df.shape


def get_column_info(df: pd.DataFrame) -> pd.DataFrame:
    """
    Get detailed column information including data types, non-null counts,
    missing counts, and missing percentages.
    """
    info_df = pd.DataFrame({
        'column_name': df.columns,
        'data_type': [str(dtype) for dtype in df.dtypes],
        'total_rows': len(df),
        'non_null_count': df.notnull().sum().values,
        'missing_count': df.isnull().sum().values,
        'missing_percentage': (df.isnull().sum().values / len(df)) * 100
    })
    return info_df


def analyze_duplicates(df: pd.DataFrame, key_column: str = None) -> Dict[str, Any]:
    """
    Analyze duplicate rows in a DataFrame and optionally duplicate key IDs.
    """
    total_duplicate_rows = int(df.duplicated().sum())
    result = {'duplicate_rows': total_duplicate_rows}
    if key_column and key_column in df.columns:
        result['duplicate_keys'] = int(df[key_column].duplicated().sum())
    return result


def analyze_unique_values(df: pd.DataFrame, columns: List[str]) -> Dict[str, List[Any]]:
    """
    Get unique values for specified categorical columns.
    """
    unique_dict = {}
    for col in columns:
        if col in df.columns:
            unique_dict[col] = sorted([x for x in df[col].dropna().unique()])
    return unique_dict


def validate_match_ids(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> Dict[str, Any]:
    """
    Validate match ID relationship between matches.csv (id) and deliveries.csv (match_id).
    """
    match_ids = set(df_matches['id'])
    delivery_match_ids = set(df_deliveries['match_id'])
    
    del_not_in_matches = sorted(list(delivery_match_ids - match_ids))
    matches_not_in_del = sorted(list(match_ids - delivery_match_ids))
    valid_matches = sorted(list(match_ids.intersection(delivery_match_ids)))
    
    return {
        'total_matches_count': len(match_ids),
        'total_delivery_matches_count': len(delivery_match_ids),
        'deliveries_without_match_record': len(del_not_in_matches),
        'matches_without_deliveries': len(matches_not_in_del),
        'valid_matched_ids_count': len(valid_matches),
        'invalid_relationships_count': len(del_not_in_matches) + len(matches_not_in_del),
        'del_not_in_matches_ids': del_not_in_matches,
        'matches_not_in_del_ids': matches_not_in_del
    }


def extract_player_information(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> Dict[str, Any]:
    """
    Extract all unique player names across all player-related columns:
    - batter
    - bowler
    - non_striker
    - player_dismissed
    - fielder (parsed for multiple players)
    - player_of_match
    """
    players_by_col = {}
    
    # Deliveries columns
    for col in ['batter', 'bowler', 'non_striker', 'player_dismissed']:
        if col in df_deliveries.columns:
            players_by_col[col] = set(df_deliveries[col].dropna().unique())
            
    if 'fielder' in df_deliveries.columns:
        fielders = set()
        for f in df_deliveries['fielder'].dropna():
            for p in f.replace(' and ', ',').split(','):
                p_clean = p.strip()
                if p_clean:
                    fielders.add(p_clean)
        players_by_col['fielder'] = fielders

    # Matches column
    if 'player_of_match' in df_matches.columns:
        players_by_col['player_of_match'] = set(df_matches['player_of_match'].dropna().unique())

    all_players = set()
    for s in players_by_col.values():
        all_players.update(s)

    # Check potential duplicates / case inconsistencies
    normalized_map = {}
    possible_duplicates = []
    for player in sorted(list(all_players)):
        norm = player.strip().lower()
        if norm in normalized_map:
            possible_duplicates.append((normalized_map[norm], player))
        else:
            normalized_map[norm] = player

    return {
        'total_unique_players': len(all_players),
        'players_by_column_count': {k: len(v) for k, v in players_by_col.items()},
        'all_players_list': sorted(list(all_players)),
        'possible_duplicate_names': possible_duplicates
    }


def generate_data_quality_report(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Generate a combined summary data quality DataFrame for both datasets.
    """
    report_rows = []
    
    for dataset_name, df in [('matches.csv', df_matches), ('deliveries.csv', df_deliveries)]:
        for col in df.columns:
            report_rows.append({
                'dataset': dataset_name,
                'column_name': col,
                'data_type': str(df[col].dtype),
                'total_rows': len(df),
                'non_null_count': int(df[col].notnull().sum()),
                'missing_count': int(df[col].isnull().sum()),
                'missing_percentage': round((df[col].isnull().sum() / len(df)) * 100, 4),
                'unique_values_count': int(df[col].nunique())
            })
            
    return pd.DataFrame(report_rows)
