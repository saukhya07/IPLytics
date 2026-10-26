"""
IPLytics - Analytics Module
Phase 2: Match, Team, Venue, Toss, Phase, Season & Head-to-Head Analytics

Provides reusable analytical functions for team performance, venue stats,
innings phases, toss impact, season trends, and team head-to-head match-ups.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Any


def calculate_team_statistics(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate comprehensive team statistics across all seasons:
    - Matches played, wins, losses, ties, no results, win percentage,
      average score, highest score, lowest score.
    """
    teams = sorted(list(set(df_matches['team1']).union(set(df_matches['team2']))))
    
    # Inning totals per match for average, max, min scores
    inn_totals = df_deliveries.groupby(['match_id', 'inning', 'batting_team'])['total_runs'].sum().reset_index()
    # Filter for main innings (innings 1 & 2)
    inn_totals_main = inn_totals[inn_totals['inning'].isin([1, 2])]
    
    team_stats = []
    
    for t in teams:
        m_played = df_matches[(df_matches['team1'] == t) | (df_matches['team2'] == t)]
        total_matches = len(m_played)
        
        wins = int((m_played['winner'] == t).sum())
        ties = int(((m_played['result'] == 'tie') & ((m_played['team1'] == t) | (m_played['team2'] == t))).sum())
        no_results = int((m_played['result'] == 'no result').sum())
        losses = total_matches - wins - ties - no_results
        
        decided_matches = total_matches - no_results
        win_pct = round((wins / decided_matches) * 100, 2) if decided_matches > 0 else 0.0
        
        # Team scores
        t_scores = inn_totals_main[inn_totals_main['batting_team'] == t]['total_runs']
        avg_score = round(t_scores.mean(), 2) if len(t_scores) > 0 else 0.0
        high_score = int(t_scores.max()) if len(t_scores) > 0 else 0
        low_score = int(t_scores.min()) if len(t_scores) > 0 else 0
        
        team_stats.append({
            'team': t,
            'matches': total_matches,
            'wins': wins,
            'losses': losses,
            'ties': ties,
            'no_results': no_results,
            'win_percentage': win_pct,
            'average_score': avg_score,
            'highest_score': high_score,
            'lowest_score': low_score
        })
        
    return pd.DataFrame(team_stats).sort_values(by='win_percentage', ascending=False)


def calculate_venue_statistics(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate venue performance metrics:
    - Matches played, avg 1st innings score, avg 2nd innings score, highest score,
      bat-first wins, chasing wins, bat-first win %, chasing win %.
    """
    venues = sorted(df_matches['venue'].unique().tolist())
    
    inn_totals = df_deliveries.groupby(['match_id', 'inning', 'batting_team'])['total_runs'].sum().reset_index()
    
    venue_stats = []
    
    for v in venues:
        m_v = df_matches[df_matches['venue'] == v]
        total_m = len(m_v)
        
        # Scores at venue
        v_match_ids = m_v['id'].unique()
        v_inn = inn_totals[inn_totals['match_id'].isin(v_match_ids)]
        
        inn1_scores = v_inn[v_inn['inning'] == 1]['total_runs']
        inn2_scores = v_inn[v_inn['inning'] == 2]['total_runs']
        
        avg_inn1 = round(inn1_scores.mean(), 2) if len(inn1_scores) > 0 else 0.0
        avg_inn2 = round(inn2_scores.mean(), 2) if len(inn2_scores) > 0 else 0.0
        high_score = int(v_inn['total_runs'].max()) if len(v_inn) > 0 else 0
        
        bat_first_wins = int((m_v['result'] == 'runs').sum())
        chasing_wins = int((m_v['result'] == 'wickets').sum())
        
        decided = bat_first_wins + chasing_wins
        bat_first_pct = round((bat_first_wins / decided) * 100, 2) if decided > 0 else 0.0
        chasing_pct = round((chasing_wins / decided) * 100, 2) if decided > 0 else 0.0
        
        venue_stats.append({
            'venue': v,
            'matches': total_m,
            'average_first_innings_score': avg_inn1,
            'average_second_innings_score': avg_inn2,
            'highest_score': high_score,
            'bat_first_wins': bat_first_wins,
            'chasing_wins': chasing_wins,
            'bat_first_win_percentage': bat_first_pct,
            'chasing_win_percentage': chasing_pct
        })
        
    return pd.DataFrame(venue_stats).sort_values(by='matches', ascending=False)


def calculate_phase_analysis(df_deliveries: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Calculate Powerplay (overs 0-5), Middle (overs 6-14), and Death (overs 15-19) phase metrics:
    - Overall phase metrics (runs, balls, run rate, wickets, boundaries).
    - Team-wise phase run rates.
    """
    def assign_phase(over_num: int) -> str:
        if 0 <= over_num <= 5:
            return 'Powerplay (1-6)'
        elif 6 <= over_num <= 14:
            return 'Middle (7-15)'
        elif 15 <= over_num <= 19:
            return 'Death (16-20)'
        return 'Other'

    df_d = df_deliveries.copy()
    df_d['phase'] = df_d['over'].apply(assign_phase)
    df_main_phase = df_d[df_d['phase'] != 'Other']

    # Legal balls
    df_main_phase['is_legal'] = ~df_main_phase['extras_type'].isin(['wides', 'noballs'])

    phase_grouped = df_main_phase.groupby('phase')
    
    phase_summary = []
    for phase_name, group in phase_grouped:
        total_runs = group['total_runs'].sum()
        legal_balls = group['is_legal'].sum()
        overs = legal_balls / 6.0
        run_rate = round(total_runs / overs, 2) if overs > 0 else 0.0
        wickets = group['is_wicket'].sum()
        fours = (group['batsman_runs'] == 4).sum()
        sixes = (group['batsman_runs'] == 6).sum()
        
        phase_summary.append({
            'phase': phase_name,
            'total_runs': total_runs,
            'legal_balls': legal_balls,
            'overs': round(overs, 1),
            'run_rate': run_rate,
            'wickets': wickets,
            'fours': fours,
            'sixes': sixes
        })

    phase_summary_df = pd.DataFrame(phase_summary)

    # Team by phase run rate
    team_phase = df_main_phase.groupby(['batting_team', 'phase']).agg(
        total_runs=('total_runs', 'sum'),
        legal_balls=('is_legal', 'sum'),
        wickets=('is_wicket', 'sum')
    ).reset_index()
    
    team_phase['run_rate'] = round(team_phase['total_runs'] / (team_phase['legal_balls'] / 6.0), 2)
    
    return phase_summary_df, team_phase


def calculate_toss_analysis(df_matches: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculate toss impact analytics:
    - Overall toss win -> match win %.
    - Toss decision distribution (field vs bat).
    - Toss win -> match win % by team.
    - Toss win -> match win % by venue.
    """
    df_valid = df_matches[df_matches['winner'].notnull()].copy()
    
    df_valid['toss_winner_is_match_winner'] = df_valid['toss_winner'] == df_valid['winner']
    
    total_valid_matches = len(df_valid)
    toss_and_match_wins = int(df_valid['toss_winner_is_match_winner'].sum())
    overall_toss_win_pct = round((toss_and_match_wins / total_valid_matches) * 100, 2)
    
    toss_decisions = df_valid['toss_decision'].value_counts().to_dict()
    
    # By team
    teams = sorted(df_valid['toss_winner'].unique().tolist())
    team_toss_stats = []
    for t in teams:
        m_tw = df_valid[df_valid['toss_winner'] == t]
        tw_cnt = len(m_tw)
        tw_mw_cnt = int((m_tw['winner'] == t).sum())
        pct = round((tw_mw_cnt / tw_cnt) * 100, 2) if tw_cnt > 0 else 0.0
        team_toss_stats.append({
            'team': t,
            'toss_wins': tw_cnt,
            'toss_and_match_wins': tw_mw_cnt,
            'win_percentage_when_winning_toss': pct
        })
        
    team_toss_df = pd.DataFrame(team_toss_stats).sort_values(by='win_percentage_when_winning_toss', ascending=False)
    
    return {
        'total_matches_analyzed': total_valid_matches,
        'toss_and_match_wins_count': toss_and_match_wins,
        'overall_toss_win_match_win_percentage': overall_toss_win_pct,
        'toss_decisions_distribution': toss_decisions,
        'team_toss_analysis': team_toss_df
    }


def calculate_head_to_head(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame, team_a: str, team_b: str) -> Dict[str, Any]:
    """
    Calculate head-to-head performance metrics between Team A and Team B.
    Reusable function for website backend and analytical reports.
    """
    m_h2h = df_matches[
        ((df_matches['team1'] == team_a) & (df_matches['team2'] == team_b)) |
        ((df_matches['team1'] == team_b) & (df_matches['team2'] == team_a))
    ].sort_values(by='date', ascending=False)

    total_matches = len(m_h2h)
    if total_matches == 0:
        return {'matches_played': 0, 'error': f"No matches found between {team_a} and {team_b}."}

    team_a_wins = int((m_h2h['winner'] == team_a).sum())
    team_b_wins = int((m_h2h['winner'] == team_b).sum())
    ties = int((m_h2h['result'] == 'tie').sum())
    no_results = int((m_h2h['result'] == 'no result').sum())

    decided = total_matches - no_results
    team_a_pct = round((team_a_wins / decided) * 100, 2) if decided > 0 else 0.0
    team_b_pct = round((team_b_wins / decided) * 100, 2) if decided > 0 else 0.0

    # Innings scores in H2H
    h2h_match_ids = m_h2h['id'].unique()
    h2h_del = df_deliveries[df_deliveries['match_id'].isin(h2h_match_ids)]
    
    inn_totals = h2h_del.groupby(['match_id', 'inning', 'batting_team'])['total_runs'].sum().reset_index()
    inn_totals_main = inn_totals[inn_totals['inning'].isin([1, 2])]

    team_a_avg_score = round(inn_totals_main[inn_totals_main['batting_team'] == team_a]['total_runs'].mean(), 2) if len(inn_totals_main[inn_totals_main['batting_team'] == team_a]) > 0 else 0.0
    team_b_avg_score = round(inn_totals_main[inn_totals_main['batting_team'] == team_b]['total_runs'].mean(), 2) if len(inn_totals_main[inn_totals_main['batting_team'] == team_b]) > 0 else 0.0

    # Recent meetings (up to 5)
    recent_meetings = []
    for row in m_h2h.head(5).itertuples():
        recent_meetings.append({
            'date': row.date,
            'season': row.season,
            'venue': row.venue,
            'winner': row.winner,
            'result': row.result,
            'margin': getattr(row, 'result_margin', np.nan)
        })

    # Venue breakdown
    venue_h2h = m_h2h.groupby('venue').agg(
        total_matches=('id', 'count'),
        team_a_wins=('winner', lambda x: (x == team_a).sum()),
        team_b_wins=('winner', lambda x: (x == team_b).sum())
    ).reset_index()

    return {
        'team_a': team_a,
        'team_b': team_b,
        'total_matches': total_matches,
        'team_a_wins': team_a_wins,
        'team_b_wins': team_b_wins,
        'ties': ties,
        'no_results': no_results,
        'team_a_win_percentage': team_a_pct,
        'team_b_win_percentage': team_b_pct,
        'team_a_average_score': team_a_avg_score,
        'team_b_average_score': team_b_avg_score,
        'recent_meetings': recent_meetings,
        'venue_h2h': venue_h2h
    }


def calculate_season_analysis(df_matches: pd.DataFrame, df_deliveries: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate season-by-season IPL analytics:
    - Matches, teams count, total runs, total wickets, avg 1st inn score,
      highest team score, lowest team score, top run scorer, top wicket taker.
    """
    seasons = sorted(df_matches['season'].unique().tolist())
    
    inn_totals = df_deliveries.groupby(['match_id', 'inning', 'batting_team'])['total_runs'].sum().reset_index()
    inn_totals_main = inn_totals[inn_totals['inning'].isin([1, 2])]
    
    season_stats = []
    
    for s in seasons:
        m_s = df_matches[df_matches['season'] == s]
        m_ids = m_s['id'].unique()
        d_s = df_deliveries[df_deliveries['match_id'].isin(m_ids)]
        
        teams_cnt = len(set(m_s['team1']).union(set(m_s['team2'])))
        tot_runs = int(d_s['total_runs'].sum())
        
        # Wickets in season
        tot_wickets = int((d_s['is_wicket'] == 1).sum())
        
        # Inning 1 average score
        s_inn1 = inn_totals_main[(inn_totals_main['match_id'].isin(m_ids)) & (inn_totals_main['inning'] == 1)]['total_runs']
        avg_inn1 = round(s_inn1.mean(), 2) if len(s_inn1) > 0 else 0.0
        
        s_inn_all = inn_totals_main[inn_totals_main['match_id'].isin(m_ids)]['total_runs']
        high_score = int(s_inn_all.max()) if len(s_inn_all) > 0 else 0
        low_score = int(s_inn_all.min()) if len(s_inn_all) > 0 else 0
        
        # Top run scorer in season
        season_bat = d_s.groupby('batter')['batsman_runs'].sum()
        top_batter = season_bat.idxmax() if len(season_bat) > 0 else "N/A"
        top_batter_runs = int(season_bat.max()) if len(season_bat) > 0 else 0
        
        # Top wicket taker in season
        bowler_dismissals = ['caught', 'bowled', 'lbw', 'stumped', 'caught and bowled', 'hit wicket']
        season_bowl = d_s[(d_s['is_wicket'] == 1) & (d_s['dismissal_kind'].isin(bowler_dismissals))].groupby('bowler').size()
        top_bowler = season_bowl.idxmax() if len(season_bowl) > 0 else "N/A"
        top_bowler_wickets = int(season_bowl.max()) if len(season_bowl) > 0 else 0
        
        season_stats.append({
            'season': s,
            'matches': len(m_s),
            'teams_count': teams_cnt,
            'total_runs': tot_runs,
            'total_wickets': tot_wickets,
            'average_first_innings_score': avg_inn1,
            'highest_score': high_score,
            'lowest_score': low_score,
            'top_run_scorer': f"{top_batter} ({top_batter_runs})",
            'top_wicket_taker': f"{top_bowler} ({top_bowler_wickets})"
        })
        
    return pd.DataFrame(season_stats)
