"""
IPLytics - Analytics Service Module
Phase 5B: Read-Only Data Query Service

Loads processed IPL datasets into memory on startup and serves read-only queries for:
- Teams & Team Details
- Players & Player Details
- Order-Independent Head-to-Head Records
- Matches (with season/team/venue filtering & pagination)
- Venues & Venue Details
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

DATA_PATHS = {
    'team_stats': os.path.join(BASE_DIR, 'data', 'processed', 'team_statistics.csv'),
    'player_stats': os.path.join(BASE_DIR, 'data', 'processed', 'player_statistics.csv'),
    'venue_stats': os.path.join(BASE_DIR, 'data', 'processed', 'venue_statistics.csv'),
    'matches': os.path.join(BASE_DIR, 'data', 'processed', 'matches_clean.csv')
}

# In-memory DataFrames
DATASETS: Dict[str, pd.DataFrame] = {}


def load_analytics_data():
    """Load processed datasets into memory if not already loaded."""
    if all(key in DATASETS for key in DATA_PATHS):
        return

    print("Loading processed IPL datasets into memory for Analytics Service...")
    
    for key, path in DATA_PATHS.items():
        if os.path.exists(path):
            if key == 'matches':
                df = pd.read_csv(path, dtype={'season': str})
            else:
                df = pd.read_csv(path)
            DATASETS[key] = df
            print(f" [PASS] Loaded {key} ({len(df)} rows)")
        else:
            print(f" [FAIL] Dataset path missing: {path}")


def get_teams_list() -> List[str]:
    """Return list of standardized IPL teams."""
    load_analytics_data()
    if 'team_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")
    return sorted(DATASETS['team_stats']['team'].tolist())


def get_team_details(team_name: str) -> Dict[str, Any]:
    """Return team statistics for a specific team."""
    load_analytics_data()
    if 'team_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")
        
    df = DATASETS['team_stats']
    match = df[df['team'].str.lower() == team_name.lower()]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found.")
        
    row = match.iloc[0].to_dict()
    # Replace NaN with None for JSON serialization
    return {k: (v if pd.notnull(v) else None) for k, v in row.items()}


def get_players_list(search: Optional[str] = None, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
    """Return paginated list of players from player_statistics.csv with total count."""
    load_analytics_data()
    if 'player_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")
        
    df = DATASETS['player_stats']
    
    if search:
        df = df[df['player'].str.contains(search, case=False, na=False)]
    
    total_count = len(df)  # total matching rows BEFORE slicing
    
    limit = min(max(1, limit), 500)
    offset = max(0, offset)
    
    sliced = df.iloc[offset:offset + limit]
    records = sliced.to_dict(orient='records')
    
    # Clean NaN values
    clean_records = []
    for r in records:
        clean_records.append({k: (v if pd.notnull(v) else None) for k, v in r.items()})
        
    return {'total_count': total_count, 'players': clean_records}


def get_player_details(player_name: str) -> Dict[str, Any]:
    """Return statistics for a specific player."""
    load_analytics_data()
    if 'player_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")
        
    df = DATASETS['player_stats']
    match = df[df['player'].str.lower() == player_name.lower()]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found.")
        
    row = match.iloc[0].to_dict()
    return {k: (v if pd.notnull(v) else None) for k, v in row.items()}


def get_head_to_head(team1: str, team2: str) -> Dict[str, Any]:
    """
    Calculate order-independent head-to-head match stats between team1 and team2.
    Response percentages are assigned to requested team1 and team2.
    """
    load_analytics_data()
    if 'matches' not in DATASETS or 'team_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")

    valid_teams = set(t.lower() for t in DATASETS['team_stats']['team'])
    if team1.lower() not in valid_teams:
        raise HTTPException(status_code=404, detail=f"Team '{team1}' not found.")
    if team2.lower() not in valid_teams:
        raise HTTPException(status_code=404, detail=f"Team '{team2}' not found.")

    df_m = DATASETS['matches']
    
    # Order-independent filter
    h2h_matches = df_m[
        ((df_m['team1'].str.lower() == team1.lower()) & (df_m['team2'].str.lower() == team2.lower())) |
        ((df_m['team1'].str.lower() == team2.lower()) & (df_m['team2'].str.lower() == team1.lower()))
    ]

    total_m = len(h2h_matches)
    if total_m == 0:
        return {
            'team1': team1,
            'team2': team2,
            'total_matches': 0,
            'team1_wins': 0,
            'team2_wins': 0,
            'ties': 0,
            'no_result': 0,
            'team1_win_percentage': 0.0,
            'team2_win_percentage': 0.0
        }

    team1_wins = int((h2h_matches['winner'].str.lower() == team1.lower()).sum())
    team2_wins = int((h2h_matches['winner'].str.lower() == team2.lower()).sum())
    ties = int((h2h_matches['result'] == 'tie').sum())
    no_results = int((h2h_matches['result'] == 'no result').sum())

    decided = total_m - no_results
    t1_pct = round((team1_wins / decided) * 100, 2) if decided > 0 else 0.0
    t2_pct = round((team2_wins / decided) * 100, 2) if decided > 0 else 0.0

    # Recent 5 meetings (sorted newest first)
    recent_rows = h2h_matches.sort_values('date', ascending=False).head(5)
    recent_meetings = []
    for _, row in recent_rows.iterrows():
        recent_meetings.append({
            'date': str(row.get('date', '')),
            'venue': str(row.get('venue', '')),
            'winner': str(row.get('winner', '')) if pd.notnull(row.get('winner')) else None,
            'result': str(row.get('result', '')),
            'result_margin': float(row['result_margin']) if pd.notnull(row.get('result_margin')) else None,
        })

    return {
        'team1': team1,
        'team2': team2,
        'total_matches': total_m,
        'team1_wins': team1_wins,
        'team2_wins': team2_wins,
        'ties': ties,
        'no_result': no_results,
        'team1_win_percentage': t1_pct,
        'team2_win_percentage': t2_pct,
        'recent_meetings': recent_meetings
    }


def get_matches_list(season: Optional[str] = None, team: Optional[str] = None, venue: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    """Return filtered matches list with total count."""
    load_analytics_data()
    if 'matches' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")

    df = DATASETS['matches'].copy()

    if season:
        df = df[df['season'].astype(str) == str(season)]

    if team:
        team_lower = team.lower()
        df = df[(df['team1'].str.lower() == team_lower) | (df['team2'].str.lower() == team_lower)]

    if venue:
        df = df[df['venue'].str.contains(venue, case=False, na=False)]

    total_count = len(df)  # total matching rows BEFORE limiting

    limit = min(max(1, limit), 200)
    records = df.sort_values(by='date', ascending=False).head(limit).to_dict(orient='records')

    clean_records = []
    for r in records:
        clean_records.append({k: (v if pd.notnull(v) else None) for k, v in r.items()})

    return {'total_count': total_count, 'matches': clean_records}


def get_match_by_id(match_id: int) -> Dict[str, Any]:
    """Return match details for a specific match_id."""
    load_analytics_data()
    if 'matches' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")

    df = DATASETS['matches']
    match = df[df['id'] == match_id]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail=f"Match ID '{match_id}' not found.")

    row = match.iloc[0].to_dict()
    return {k: (v if pd.notnull(v) else None) for k, v in row.items()}


def get_venues_list() -> List[Dict[str, Any]]:
    """Return all venue statistics."""
    load_analytics_data()
    if 'venue_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")

    records = DATASETS['venue_stats'].to_dict(orient='records')
    clean_records = []
    for r in records:
        clean_records.append({k: (v if pd.notnull(v) else None) for k, v in r.items()})
    return clean_records


def get_venue_details(venue_name: str) -> Dict[str, Any]:
    """Return venue statistics for a specific venue."""
    load_analytics_data()
    if 'venue_stats' not in DATASETS:
        raise HTTPException(status_code=500, detail="Analytics data not initialized.")

    df = DATASETS['venue_stats']
    match = df[df['venue'].str.lower() == venue_name.lower()]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail=f"Venue '{venue_name}' not found.")

    row = match.iloc[0].to_dict()
    return {k: (v if pd.notnull(v) else None) for k, v in row.items()}

