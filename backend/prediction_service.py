"""
IPLytics - Prediction Service Module
Phase 5A: ML Inference Wrapper

Converts validated Pydantic requests into feature DataFrames strictly matching
the trained feature schema, executes joblib pipelines, and returns responses.
"""

import pandas as pd
import numpy as np
from fastapi import HTTPException

from backend.model_loader import get_model
from backend.schemas import (
    MatchWinnerRequest, MatchWinnerResponse,
    LiveWinProbabilityRequest, LiveWinProbabilityResponse,
    ScorePredictionRequest, ScorePredictionResponse,
    PlayerOfMatchRequest, PlayerOfMatchResponse
)


def predict_match_winner(req: MatchWinnerRequest) -> MatchWinnerResponse:
    """Task 1: Predict match winner given pre-match team features."""
    try:
        pipe = get_model('match_winner')
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
        
    df = pd.DataFrame([{
        'team1': req.team1,
        'team2': req.team2,
        'venue': req.venue,
        'city': req.city,
        'toss_winner': req.toss_winner,
        'toss_decision': req.toss_decision,
        'team1_historical_win_rate': req.team1_historical_win_rate,
        'team2_historical_win_rate': req.team2_historical_win_rate,
        'team1_recent_form_5': req.team1_recent_form_5,
        'team2_recent_form_5': req.team2_recent_form_5,
        'h2h_team1_wins': req.h2h_team1_wins,
        'h2h_team2_wins': req.h2h_team2_wins,
        'h2h_total_matches': req.h2h_total_matches,
        'h2h_team1_win_rate': req.h2h_team1_win_rate,
        'team1_venue_win_rate': req.team1_venue_win_rate,
        'team2_venue_win_rate': req.team2_venue_win_rate,
        'venue_avg_first_innings_score_historical': req.venue_avg_first_innings_score_historical
    }])
    
    try:
        probas = pipe.predict_proba(df)[0]
        # In match_winner_dataset, target team1_win: class 1 is team1 win, class 0 is team2 win
        prob_team1 = round(float(probas[1]), 4)
        prob_team2 = round(float(probas[0]), 4)
        
        predicted_winner = req.team1 if prob_team1 >= prob_team2 else req.team2
        
        return MatchWinnerResponse(
            team1=req.team1,
            team2=req.team2,
            predicted_winner=predicted_winner,
            probabilities={
                req.team1: prob_team1,
                req.team2: prob_team2
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match Winner prediction error: {str(e)}")


def predict_live_win_probability(req: LiveWinProbabilityRequest) -> LiveWinProbabilityResponse:
    """Task 2: Predict live win probability in 2nd innings chase."""
    try:
        pipe = get_model('live_win_probability')
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Calculate derived live in-match features
    wickets_in_hand = max(0, 10 - req.wickets_fallen)
    overs_completed = req.legal_balls_bowled / 6.0
    balls_remaining = max(0, 120 - req.legal_balls_bowled)
    current_run_rate = round(req.current_score / overs_completed, 2) if overs_completed > 0 else 0.0
    runs_required = max(0, int(req.target - req.current_score))
    overs_rem = balls_remaining / 6.0
    required_run_rate = round(runs_required / overs_rem, 2) if overs_rem > 0 else (0.0 if runs_required == 0 else 99.99)
    crr_minus_rrr = round(current_run_rate - required_run_rate, 2)

    df = pd.DataFrame([{
        'batting_team': req.batting_team,
        'bowling_team': req.bowling_team,
        'venue': req.venue,
        'city': req.city,
        'current_score': req.current_score,
        'wickets_fallen': req.wickets_fallen,
        'wickets_in_hand': wickets_in_hand,
        'legal_balls_bowled': req.legal_balls_bowled,
        'overs_completed': overs_completed,
        'balls_remaining': balls_remaining,
        'current_run_rate': current_run_rate,
        'target': req.target,
        'runs_required': runs_required,
        'required_run_rate': required_run_rate,
        'crr_minus_rrr': crr_minus_rrr,
        'runs_last_6_balls': req.runs_last_6_balls,
        'runs_last_30_balls': req.runs_last_30_balls,
        'wickets_last_30_balls': req.wickets_last_30_balls,
        'boundaries_so_far': req.boundaries_so_far,
        'partnership_runs': req.partnership_runs
    }])

    try:
        probas = pipe.predict_proba(df)[0]
        # Safely find index of class 1 (batting_team_wins=1 means batting team won)
        # pipe[-1] accesses the classifier step; classes_ gives the label ordering
        classifier = pipe[-1]
        classes = list(classifier.classes_)
        idx_win = classes.index(1) if 1 in classes else 1   # index where label==1
        prob_batting_win = round(float(probas[idx_win]), 4)
        prob_bowling_win = round(1.0 - prob_batting_win, 4)

        return LiveWinProbabilityResponse(
            batting_team=req.batting_team,
            bowling_team=req.bowling_team,
            batting_team_win_probability=prob_batting_win,
            bowling_team_win_probability=prob_bowling_win
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live Win Probability prediction error: {str(e)}")


def predict_score(req: ScorePredictionRequest) -> ScorePredictionResponse:
    """Task 3: Predict final 1st innings total score."""
    try:
        pipe = get_model('score_prediction')
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    wickets_in_hand = max(0, 10 - req.wickets_fallen)
    overs_completed = req.legal_balls_bowled / 6.0
    balls_remaining = max(0, 120 - req.legal_balls_bowled)
    current_run_rate = round(req.current_score / overs_completed, 2) if overs_completed > 0 else 0.0

    df = pd.DataFrame([{
        'batting_team': req.batting_team,
        'bowling_team': req.bowling_team,
        'venue': req.venue,
        'city': req.city,
        'current_score': req.current_score,
        'wickets_fallen': req.wickets_fallen,
        'wickets_in_hand': wickets_in_hand,
        'legal_balls_bowled': req.legal_balls_bowled,
        'overs_completed': overs_completed,
        'balls_remaining': balls_remaining,
        'current_run_rate': current_run_rate,
        'runs_last_6_balls': req.runs_last_6_balls,
        'runs_last_30_balls': req.runs_last_30_balls,
        'wickets_last_30_balls': req.wickets_last_30_balls,
        'boundaries_so_far': req.boundaries_so_far,
        'partnership_runs': req.partnership_runs
    }])

    try:
        pred_score = float(pipe.predict(df)[0])
        return ScorePredictionResponse(
            batting_team=req.batting_team,
            bowling_team=req.bowling_team,
            predicted_final_score=round(pred_score, 1)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Score prediction error: {str(e)}")


def predict_player_of_match(req: PlayerOfMatchRequest) -> PlayerOfMatchResponse:
    """Task 4: Predict Player of the Match candidate probability."""
    try:
        pipe = get_model('player_of_match')
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    df = pd.DataFrame([{
        'player': req.player,
        'hist_runs': req.hist_runs,
        'hist_balls_faced': req.hist_balls_faced,
        'hist_strike_rate': req.hist_strike_rate,
        'hist_wickets': req.hist_wickets,
        'hist_balls_bowled': req.hist_balls_bowled,
        'hist_runs_conceded': req.hist_runs_conceded,
        'hist_economy': req.hist_economy,
        'hist_pom_count': req.hist_pom_count,
        'recent_avg_runs_5': req.recent_avg_runs_5,
        'recent_avg_wickets_5': req.recent_avg_wickets_5
    }])

    try:
        pred_cls = int(pipe.predict(df)[0])
        probas = pipe.predict_proba(df)[0]
        prob_pom = round(float(probas[1]), 4)

        return PlayerOfMatchResponse(
            predicted_player=req.player,
            is_player_of_match_predicted=pred_cls,
            probability=prob_pom
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Player of Match prediction error: {str(e)}")
