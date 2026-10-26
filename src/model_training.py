"""
IPLytics - Model Training Module
Phase 4: Chronological Model Training & Pipeline Assembly

Trains classification and regression models using strict chronological train/test splits.
Features:
- Fit preprocessing ONLY on training data.
- Save preprocessing + model pipelines using joblib.
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import Tuple, Dict, List, Any

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor


TEST_SEASONS = ['2023', '2024']
RANDOM_STATE = 42


def get_chronological_split(df: pd.DataFrame, season_col: str = 'season') -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split dataset chronologically: Train (2008-2022), Test (2023-2024)."""
    df[season_col] = df[season_col].astype(str)
    train_df = df[~df[season_col].isin(TEST_SEASONS)].copy()
    test_df = df[df[season_col].isin(TEST_SEASONS)].copy()
    return train_df, test_df


def build_match_winner_models(df_mw: pd.DataFrame, models_dir: str):
    """Task 1: Train & Save Match Winner Models (Classification)."""
    train_df, test_df = get_chronological_split(df_mw)
    
    cat_cols = ['team1', 'team2', 'venue', 'city', 'toss_winner', 'toss_decision']
    num_cols = [
        'team1_historical_win_rate', 'team2_historical_win_rate',
        'team1_recent_form_5', 'team2_recent_form_5',
        'h2h_team1_wins', 'h2h_team2_wins', 'h2h_total_matches', 'h2h_team1_win_rate',
        'team1_venue_win_rate', 'team2_venue_win_rate',
        'venue_avg_first_innings_score_historical'
    ]
    target_col = 'team1_win'

    X_train, y_train = train_df[cat_cols + num_cols], train_df[target_col]
    X_test, y_test = test_df[cat_cols + num_cols], test_df[target_col]

    preprocessor = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
        ('num', StandardScaler(), num_cols)
    ])

    models = {
        'logistic_regression': LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
        'random_forest': RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE),
        'xgboost': XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=RANDOM_STATE, eval_metric='logloss')
    }

    saved_pipelines = {}
    task_dir = os.path.join(models_dir, 'match_winner')
    os.makedirs(task_dir, exist_ok=True)

    for name, model in models.items():
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
        pipe.fit(X_train, y_train)
        
        save_path = os.path.join(task_dir, f"match_winner_{name}.joblib")
        joblib.dump(pipe, save_path)
        saved_pipelines[name] = pipe

    return saved_pipelines, X_train, y_train, X_test, y_test


def build_live_win_probability_models(df_lwp: pd.DataFrame, models_dir: str):
    """Task 2: Train & Save Live Win Probability Models (Classification)."""
    train_df, test_df = get_chronological_split(df_lwp)
    
    cat_cols = ['batting_team', 'bowling_team', 'venue', 'city']
    num_cols = [
        'current_score', 'wickets_fallen', 'wickets_in_hand', 'legal_balls_bowled',
        'overs_completed', 'balls_remaining', 'current_run_rate', 'target',
        'runs_required', 'required_run_rate', 'crr_minus_rrr',
        'runs_last_6_balls', 'runs_last_30_balls', 'wickets_last_30_balls',
        'boundaries_so_far', 'partnership_runs'
    ]
    target_col = 'batting_team_wins'

    X_train, y_train = train_df[cat_cols + num_cols], train_df[target_col]
    X_test, y_test = test_df[cat_cols + num_cols], test_df[target_col]

    preprocessor = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
        ('num', StandardScaler(), num_cols)
    ])

    models = {
        'logistic_regression': LogisticRegression(random_state=RANDOM_STATE, max_iter=1000),
        'random_forest': RandomForestClassifier(n_estimators=100, max_depth=12, random_state=RANDOM_STATE, n_jobs=-1),
        'xgboost': XGBClassifier(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=RANDOM_STATE, eval_metric='logloss', n_jobs=-1)
    }

    saved_pipelines = {}
    task_dir = os.path.join(models_dir, 'live_win_probability')
    os.makedirs(task_dir, exist_ok=True)

    for name, model in models.items():
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
        pipe.fit(X_train, y_train)
        
        save_path = os.path.join(task_dir, f"live_win_probability_{name}.joblib")
        joblib.dump(pipe, save_path)
        saved_pipelines[name] = pipe

    return saved_pipelines, X_train, y_train, X_test, y_test


def build_score_prediction_models(df_sp: pd.DataFrame, models_dir: str):
    """Task 3: Train & Save Final Score Prediction Models (Regression)."""
    train_df, test_df = get_chronological_split(df_sp)
    
    cat_cols = ['batting_team', 'bowling_team', 'venue', 'city']
    num_cols = [
        'current_score', 'wickets_fallen', 'wickets_in_hand', 'legal_balls_bowled',
        'overs_completed', 'balls_remaining', 'current_run_rate',
        'runs_last_6_balls', 'runs_last_30_balls', 'wickets_last_30_balls',
        'boundaries_so_far', 'partnership_runs'
    ]
    target_col = 'final_score'

    X_train, y_train = train_df[cat_cols + num_cols], train_df[target_col]
    X_test, y_test = test_df[cat_cols + num_cols], test_df[target_col]

    preprocessor = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
        ('num', StandardScaler(), num_cols)
    ])

    models = {
        'linear_regression': LinearRegression(),
        'random_forest': RandomForestRegressor(n_estimators=100, max_depth=12, random_state=RANDOM_STATE, n_jobs=-1),
        'xgboost': XGBRegressor(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=RANDOM_STATE, n_jobs=-1)
    }

    saved_pipelines = {}
    task_dir = os.path.join(models_dir, 'score_prediction')
    os.makedirs(task_dir, exist_ok=True)

    for name, model in models.items():
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])
        pipe.fit(X_train, y_train)
        
        save_path = os.path.join(task_dir, f"score_prediction_{name}.joblib")
        joblib.dump(pipe, save_path)
        saved_pipelines[name] = pipe

    return saved_pipelines, X_train, y_train, X_test, y_test


def build_player_of_match_models(df_pom: pd.DataFrame, models_dir: str):
    """Task 4: Train & Save Player of Match Models (Imbalanced Classification)."""
    train_df, test_df = get_chronological_split(df_pom)
    
    cat_cols = ['player']
    num_cols = [
        'hist_runs', 'hist_balls_faced', 'hist_strike_rate',
        'hist_wickets', 'hist_balls_bowled', 'hist_runs_conceded', 'hist_economy',
        'hist_pom_count', 'recent_avg_runs_5', 'recent_avg_wickets_5'
    ]
    target_col = 'is_player_of_match'

    X_train, y_train = train_df[cat_cols + num_cols], train_df[target_col]
    X_test, y_test = test_df[cat_cols + num_cols], test_df[target_col]

    # Pos weight for XGBoost
    neg_cnt = (y_train == 0).sum()
    pos_cnt = (y_train == 1).sum()
    scale_pos = (neg_cnt / pos_cnt) if pos_cnt > 0 else 1.0

    preprocessor = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
        ('num', StandardScaler(), num_cols)
    ])

    models = {
        'logistic_regression': LogisticRegression(class_weight='balanced', random_state=RANDOM_STATE, max_iter=1000),
        'random_forest': RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=RANDOM_STATE, n_jobs=-1),
        'xgboost': XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=4, scale_pos_weight=scale_pos, random_state=RANDOM_STATE, eval_metric='logloss', n_jobs=-1)
    }

    saved_pipelines = {}
    task_dir = os.path.join(models_dir, 'player_of_match')
    os.makedirs(task_dir, exist_ok=True)

    for name, model in models.items():
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
        pipe.fit(X_train, y_train)
        
        save_path = os.path.join(task_dir, f"player_of_match_{name}.joblib")
        joblib.dump(pipe, save_path)
        saved_pipelines[name] = pipe

    return saved_pipelines, X_train, y_train, X_test, y_test
