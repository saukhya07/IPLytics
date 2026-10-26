"""
IPLytics - Model Loader Module
Phase 5A: Real Model Artifact Loader

Loads the four verified .joblib model pipelines using project-root-relative paths.
Exposes loading status via get_model_status() and is_all_models_loaded().
"""

import os
import joblib
from typing import Dict, Any

# Project root directory (IPLytics/)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

MODEL_PATHS = {
    "match_winner": os.path.join(BASE_DIR, "models", "match_winner", "match_winner_logistic_regression.joblib"),
    "live_win_probability": os.path.join(BASE_DIR, "models", "live_win_probability", "live_win_probability_xgboost.joblib"),
    "score_prediction": os.path.join(BASE_DIR, "models", "score_prediction", "score_prediction_xgboost.joblib"),
    "player_of_match": os.path.join(BASE_DIR, "models", "player_of_match", "player_of_match_xgboost.joblib")
}

MODELS: Dict[str, Any] = {}
MODEL_STATUS: Dict[str, bool] = {
    "match_winner": False,
    "live_win_probability": False,
    "score_prediction": False,
    "player_of_match": False
}


def load_all_models() -> Dict[str, bool]:
    """
    Loads all four ML model artifacts into memory and updates MODEL_STATUS.
    """
    for task_name, rel_path in MODEL_PATHS.items():
        try:
            if not os.path.exists(rel_path):
                print(f"[FAIL] Model artifact missing at: {rel_path}")
                MODEL_STATUS[task_name] = False
                continue
                
            model = joblib.load(rel_path)
            MODELS[task_name] = model
            MODEL_STATUS[task_name] = True
            print(f"[PASS] {task_name.replace('_', ' ').title()} model loaded")
        except Exception as e:
            print(f"[FAIL] Error loading {task_name} model from {rel_path}: {e}")
            MODEL_STATUS[task_name] = False

    return MODEL_STATUS


def get_model_status() -> Dict[str, bool]:
    """Return model loading status dictionary."""
    if not any(MODEL_STATUS.values()):
        load_all_models()
    return MODEL_STATUS


def is_all_models_loaded() -> bool:
    """Check if all four models loaded successfully."""
    if not any(MODEL_STATUS.values()):
        load_all_models()
    return all(MODEL_STATUS.values())


def get_model(task_name: str) -> Any:
    """Retrieve loaded model pipeline by task name."""
    if not any(MODEL_STATUS.values()):
        load_all_models()
    if task_name not in MODELS or not MODEL_STATUS.get(task_name, False):
        raise ValueError(f"Model '{task_name}' is not loaded or unavailable.")
    return MODELS[task_name]

