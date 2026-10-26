# IPLytics — Project Context Document (AI Handoff)

> **Generated**: 2026-10-14 | Based strictly on code/reports in the repository — no guessing.

---

## 1. Project Goal

**IPLytics** is a full-stack IPL (Indian Premier League) cricket analytics and machine learning platform.

It consists of:
1. **A Python ML pipeline** that trains four independent prediction models on 17 seasons of IPL ball-by-ball data (2008–2024).
2. **A FastAPI REST backend** that loads the trained model artifacts and serves predictions + analytics endpoints.
3. **A React/TypeScript frontend** that consumes the backend API to display predictions, analytics, historical data, and a live ball-by-ball match simulator.

The **four ML prediction tasks** are:
| # | Task | Type | Selected Best Model |
|---|---|---|---|
| 1 | Match Winner Prediction | Binary Classification | Logistic Regression |
| 2 | Live Win Probability (2nd innings chase) | Binary Classification | XGBoost |
| 3 | Final Score Prediction (1st innings) | Regression | XGBoost |
| 4 | Player of the Match (Experimental) | Imbalanced Classification | XGBoost |

---

## 2. Folder Structure

```
IPLytics/
│
├── matches.csv                      # Raw IPL matches data (1095 rows, 20 cols)
├── deliveries.csv                   # Raw IPL ball-by-ball deliveries (260920 rows, 17 cols)
├── requirements.txt                 # Python ML/backend dependencies
├── test_phase5c_simulator.py        # Integration test for the simulator
├── PROJECT_CONTEXT.md               # This file
│
├── data/
│   ├── raw/                         # (empty placeholder)
│   ├── processed/
│   │   ├── matches_clean.csv        # Team-name-standardized, city-imputed matches
│   │   ├── deliveries_clean.csv     # Whitespace-stripped deliveries
│   │   ├── player_statistics.csv    # Aggregated player career stats
│   │   ├── team_statistics.csv      # Aggregated team stats (wins, avg score, etc.)
│   │   └── venue_statistics.csv     # Venue bat-first/chase win rates, avg scores
│   └── ml/
│       ├── match_winner_dataset.csv          # 1090 rows, 21 cols — target: team1_win
│       ├── live_win_probability_dataset.csv  # 125,714 rows, 23 cols — target: batting_team_wins
│       ├── score_prediction_dataset.csv      # 134,555 rows, 19 cols — target: final_score
│       └── player_of_match_dataset.csv       # 23,405 rows, 15 cols — target: is_player_of_match
│
├── models/
│   ├── match_winner/
│   │   ├── match_winner_logistic_regression.joblib   ← ACTIVE (backend uses this)
│   │   ├── match_winner_random_forest.joblib
│   │   └── match_winner_xgboost.joblib
│   ├── live_win_probability/
│   │   ├── live_win_probability_xgboost.joblib       ← ACTIVE
│   │   ├── live_win_probability_random_forest.joblib
│   │   └── live_win_probability_logistic_regression.joblib
│   ├── score_prediction/
│   │   ├── score_prediction_xgboost.joblib           ← ACTIVE
│   │   ├── score_prediction_random_forest.joblib
│   │   └── score_prediction_linear_regression.joblib
│   └── player_of_match/
│       ├── player_of_match_xgboost.joblib            ← ACTIVE
│       ├── player_of_match_random_forest.joblib
│       └── player_of_match_logistic_regression.joblib
│
├── src/                             # Python ML pipeline (Phases 1–4)
│   ├── __init__.py
│   ├── preprocessing.py             # Phase 1: data cleaning, team name standardization
│   ├── analytics.py                 # Phase 2: team/venue/toss/season/H2H analytics
│   ├── player_stats.py              # Phase 2: player career stat aggregation
│   ├── data_validation.py           # Phase 2: data quality validation utilities
│   ├── feature_engineering.py       # Phase 3: pre-match historical features (no leakage)
│   ├── live_features.py             # Phase 3: ball-by-ball in-match live features
│   ├── ml_data_builder.py           # Phase 3: assembles all 4 ML datasets
│   ├── model_training.py            # Phase 4: trains and saves all 12 model pipelines
│   ├── model_evaluation.py          # Phase 4: evaluation metrics, plots, MODEL_COMPARISON.md
│   └── verify_models.py             # Phase 4.5: artifact verification script
│
├── backend/                         # FastAPI REST API (Phase 5)
│   ├── __init__.py
│   ├── main.py                      # FastAPI app, routes, startup event
│   ├── model_loader.py              # joblib artifact loader, status tracking
│   ├── prediction_service.py        # Inference wrappers for all 4 models
│   ├── analytics_service.py         # Read-only data query service (teams, players, venues)
│   ├── simulator_service.py         # Phase 5C: ball-by-ball match simulator engine
│   ├── schemas.py                   # Pydantic request/response models
│   └── requirements.txt             # Backend-specific requirements (includes fastapi, uvicorn)
│
├── frontend/                        # React + TypeScript frontend (Phase 5+)
│   └── src/
│       ├── App.tsx                  # Root router
│       ├── main.tsx                 # Entry point
│       ├── App.css / index.css      # Global styles
│       ├── components/
│       │   ├── Header.tsx
│       │   └── Sidebar.tsx
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── MatchWinnerPage.tsx
│       │   ├── LiveWinProbabilityPage.tsx
│       │   ├── ScorePredictionPage.tsx
│       │   ├── PlayerOfMatchPage.tsx
│       │   ├── SimulatorPage.tsx
│       │   ├── TeamsPage.tsx
│       │   ├── PlayersPage.tsx
│       │   ├── HeadToHeadPage.tsx
│       │   └── PlaceholderPage.tsx
│       └── services/                # API client functions
│
├── notebooks/
│   └── 01_eda.ipynb                 # EDA notebook
│
└── reports/
    ├── DATA_SUMMARY.md              # Phase 1 full data audit report
    ├── EDA_REPORT.md                # Phase 2 EDA findings
    ├── FEATURE_DICTIONARY.md        # Phase 3 feature definitions
    ├── MODEL_COMPARISON.md          # Phase 4 model scores (all 3 candidates per task)
    ├── PHASE_4_5_VERIFICATION.md    # Phase 4.5 final model selection + verification
    ├── ml_dataset_summary.md        # Dataset row/column counts
    ├── feature_validation_report.md # Feature schema validation results
    ├── data_quality_report.csv
    ├── team_name_mapping.csv
    ├── model_evaluation/            # Saved evaluation CSVs
    └── figures/                     # Saved matplotlib plots
```

---

## 3. Raw Datasets and Columns

### `matches.csv` — 1095 rows, 20 columns

| Column | Type | Notes |
|---|---|---|
| `id` | int64 | Unique match identifier |
| `season` | str | e.g. `'2007/08'`, `'2024'` (mixed format — always read as `dtype={'season': str}`) |
| `city` | str | 51 missing — imputed for Dubai/Sharjah venues |
| `date` | str | YYYY-MM-DD format |
| `match_type` | str | League, Final, Qualifier 1, Qualifier 2, Eliminator, Semi Final, etc. |
| `player_of_match` | str | 5 missing (no-result matches) |
| `venue` | str | 58 unique venues |
| `team1` | str | Home/listed team |
| `team2` | str | Away/listed team |
| `toss_winner` | str | Team that won the toss |
| `toss_decision` | str | `'bat'` or `'field'` |
| `winner` | str | 5 missing (no-result matches) |
| `result` | str | `'runs'`, `'wickets'`, `'tie'`, `'no result'` |
| `result_margin` | float64 | 19 missing (5 no-result + 14 tied via super over) |
| `target_runs` | float64 | 3 missing (abandoned before 1st innings) |
| `target_overs` | float64 | 3 missing |
| `super_over` | str | `'Y'` or `'N'` |
| `method` | str | 1074 missing — populated only for DLS matches (21 total) |
| `umpire1` | str | |
| `umpire2` | str | |

### `deliveries.csv` — 260,920 rows, 17 columns

| Column | Type | Notes |
|---|---|---|
| `match_id` | int64 | FK → `matches.id` |
| `inning` | int64 | 1, 2, or super over (3+) |
| `batting_team` | str | |
| `bowling_team` | str | |
| `over` | int64 | 0-indexed over number |
| `ball` | int64 | Ball within over |
| `batter` | str | |
| `bowler` | str | |
| `non_striker` | str | |
| `batsman_runs` | int64 | Runs scored off bat |
| `extra_runs` | int64 | |
| `total_runs` | int64 | `batsman_runs + extra_runs` |
| `extras_type` | str | 94.59% missing — only populated when extras occur: `wides`, `noballs`, `byes`, `legbyes`, `penalty` |
| `is_wicket` | int64 | 0 or 1 |
| `player_dismissed` | str | 95.04% missing — only populated when wicket falls |
| `dismissal_kind` | str | 95.04% missing — `caught`, `bowled`, `lbw`, `stumped`, `caught and bowled`, `hit wicket`, `run out`, `retired hurt`, etc. |
| `fielder` | str | 96.41% missing — populated only for fielder-assisted dismissals |

---

## 4. Data Preprocessing (`src/preprocessing.py`)

**Phase 1 — applied once before any feature engineering:**

1. **Team Name Standardization** — replaces historical franchise names in both `matches` and `deliveries` DataFrames:
   ```python
   TEAM_NAME_MAPPINGS = {
       'Delhi Daredevils':              'Delhi Capitals',      # 161 matches, 37511 deliveries
       'Kings XI Punjab':               'Punjab Kings',        # 190 matches, 45129 deliveries
       'Royal Challengers Bangalore':   'Royal Challengers Bengaluru',  # 240 matches, 56563 deliveries
       'Rising Pune Supergiants':       'Rising Pune Supergiant'  # 14 matches, 3195 deliveries
   }
   ```

2. **City Imputation** — fills missing `city` for two overseas venues:
   ```python
   VENUE_CITY_MAPPINGS = {
       'Dubai International Cricket Stadium': 'Dubai',    # 33 matches
       'Sharjah Cricket Stadium': 'Sharjah'               # 18 matches
   }
   ```

3. **Whitespace stripping** — all string columns strip leading/trailing whitespace; `'nan'` and `'None'` strings → `NaN`.

4. **No deletions** — no-result matches, tied matches, super-over matches, and DLS matches are all preserved.

**Outputs:** `data/processed/matches_clean.csv`, `data/processed/deliveries_clean.csv`

---

## 5. Feature Engineering

### 5.1 Pre-Match Features (`src/feature_engineering.py` → `build_pre_match_features`)

**Critical rule: Chronological loop — historical data is updated AFTER each match to prevent leakage.**

All features computed from data strictly BEFORE the current match date:

| Feature | Description | Default (cold start) |
|---|---|---|
| `team1_historical_win_rate` | Win % over all prior completed matches | `0.50` |
| `team2_historical_win_rate` | Win % over all prior completed matches | `0.50` |
| `team1_recent_form_5` | Win % in last 5 completed matches | `0.50` |
| `team2_recent_form_5` | Win % in last 5 completed matches | `0.50` |
| `h2h_team1_wins` | H2H wins count for team1 vs team2 prior to match | `0` |
| `h2h_team2_wins` | H2H wins count for team2 vs team1 prior to match | `0` |
| `h2h_total_matches` | Total H2H matches played prior | `0` |
| `h2h_team1_win_rate` | H2H win rate for team1 | `0.50` |
| `team1_venue_win_rate` | Win % at this specific venue prior to match | Falls back to `team1_historical_win_rate` |
| `team2_venue_win_rate` | Win % at this specific venue prior to match | Falls back to `team2_historical_win_rate` |
| `venue_avg_first_innings_score_historical` | Average 1st innings score at venue prior to match | `160.0` |

### 5.2 Pre-Match Player Features (`src/feature_engineering.py` → `build_pre_match_player_features`)

One row per player per match, using only stats from matches BEFORE the current one:

| Feature | Description |
|---|---|
| `hist_runs` | Cumulative batting runs |
| `hist_balls_faced` | Cumulative legal balls faced |
| `hist_strike_rate` | `hist_runs / hist_balls_faced * 100` |
| `hist_wickets` | Cumulative bowler wickets (counted via bowler-credited dismissal kinds) |
| `hist_balls_bowled` | Cumulative legal balls bowled (excludes wides/noballs) |
| `hist_runs_conceded` | Cumulative runs conceded (excludes byes/legbyes/penalty) |
| `hist_economy` | `hist_runs_conceded / (hist_balls_bowled / 6)` |
| `hist_pom_count` | Cumulative Player of the Match awards |
| `recent_avg_runs_5` | Average batting runs over last 5 match appearances |
| `recent_avg_wickets_5` | Average wickets over last 5 match appearances |
| `is_player_of_match` | Binary target: 1 if player won POM in this match |

### 5.3 Live In-Match Features (`src/live_features.py` → `compute_live_delivery_features`)

Computed ball-by-ball, state captured AFTER each delivery. No future delivery info used.

| Feature | Description |
|---|---|
| `current_score` | Running total runs in innings |
| `wickets_fallen` | Total wickets lost so far |
| `wickets_in_hand` | `max(0, 10 - wickets_fallen)` |
| `legal_balls_bowled` | Balls that count (excludes wides/noballs) |
| `overs_completed` | `legal_balls_bowled / 6.0` |
| `balls_remaining` | `max(0, 120 - legal_balls_bowled)` |
| `current_run_rate` | `current_score / overs_completed` |
| `target` | 2nd innings only — runs required to win |
| `runs_required` | `max(0, target - current_score)` (2nd innings only) |
| `required_run_rate` | `runs_required / (balls_remaining / 6)` (2nd innings only) |
| `crr_minus_rrr` | `current_run_rate - required_run_rate` (2nd innings only) |
| `runs_last_6_balls` | Runs from last 6 deliveries |
| `runs_last_30_balls` | Runs from last 30 deliveries |
| `wickets_last_30_balls` | Wickets from last 30 deliveries |
| `boundaries_so_far` | Count of 4s and 6s in innings so far |
| `partnership_runs` | Runs scored in current partnership (resets on wicket) |
| `batting_team_wins` | Target for live win probability (binary: 1 or 0) |
| `inn_final_score` | Target for score prediction regression |

---

## 6. ML Datasets (from `data/ml/`)

| Dataset File | Rows | Columns | Target Column | Split |
|---|---|---|---|---|
| `match_winner_dataset.csv` | 1,090 | 21 | `team1_win` (binary) | Train: 946 rows (2008–2022), Test: 144 rows (2023–2024) |
| `live_win_probability_dataset.csv` | 125,714 | 23 | `batting_team_wins` (binary) | Train: 108,883, Test: 16,831 |
| `score_prediction_dataset.csv` | 134,555 | 19 | `final_score` (continuous) | Train: 116,538, Test: 18,017 |
| `player_of_match_dataset.csv` | 23,405 | 15 | `is_player_of_match` (binary, ~4.6% positive) | Train: 20,072, Test: 3,333 |

**Important:** All datasets have 0 missing values and 0 duplicate rows (per Phase 4.5 verification).

**Train/Test split:** Strictly chronological — `TEST_SEASONS = ['2023', '2024']`. Season column must always be read as `str` (mixed format: `'2007/08'`, `'2009'`, etc.).

---

## 7. Models Used — Hyperparameters and Scores

All models are `sklearn.pipeline.Pipeline` objects wrapping `ColumnTransformer` (preprocessing) + estimator.
All `.joblib` files are self-contained and accept raw feature DataFrames directly.

**Preprocessing inside each pipeline:**
- Categorical columns: `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`
- Numerical columns: `StandardScaler()`
- Applied via `ColumnTransformer`; fit ONLY on training data.

---

### Task 1: Match Winner Prediction

**Categorical features:** `['team1', 'team2', 'venue', 'city', 'toss_winner', 'toss_decision']`  
**Numerical features:** `['team1_historical_win_rate', 'team2_historical_win_rate', 'team1_recent_form_5', 'team2_recent_form_5', 'h2h_team1_wins', 'h2h_team2_wins', 'h2h_total_matches', 'h2h_team1_win_rate', 'team1_venue_win_rate', 'team2_venue_win_rate', 'venue_avg_first_innings_score_historical']`  
**Target:** `team1_win` (1 = team1 wins, 0 = team2 wins)

| Model | Hyperparameters | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|---|
| Logistic Regression ✅ | `max_iter=1000, random_state=42` | 0.5208 | 0.5517 | 0.4267 | **0.4812** | **0.5569** |
| Random Forest | `n_estimators=100, random_state=42` | 0.4861 | 0.5143 | 0.2400 | 0.3273 | 0.5281 |
| XGBoost | `n_estimators=100, lr=0.05, max_depth=4, eval_metric='logloss'` | 0.5764 | 0.6944 | 0.3333 | 0.4505 | 0.5934 |

> ✅ **Selected:** `match_winner_logistic_regression.joblib`  
> **Phase 4.5 re-verified score:** Accuracy 0.6667, F1 0.7059, ROC-AUC 0.7025

---

### Task 2: Live Win Probability (2nd innings)

**Categorical features:** `['batting_team', 'bowling_team', 'venue', 'city']`  
**Numerical features:** `['current_score', 'wickets_fallen', 'wickets_in_hand', 'legal_balls_bowled', 'overs_completed', 'balls_remaining', 'current_run_rate', 'target', 'runs_required', 'required_run_rate', 'crr_minus_rrr', 'runs_last_6_balls', 'runs_last_30_balls', 'wickets_last_30_balls', 'boundaries_so_far', 'partnership_runs']`  
**Target:** `batting_team_wins` (1 = batting team wins the match)

| Model | Hyperparameters | Accuracy | F1 | ROC-AUC | Log Loss | Brier Score |
|---|---|---|---|---|---|---|
| Logistic Regression | `max_iter=1000, random_state=42` | 0.7651 | 0.7255 | 0.8289 | 0.5764 | 0.1785 |
| Random Forest | `n_estimators=100, max_depth=12, n_jobs=-1` | 0.7863 | 0.7536 | 0.8597 | **0.4657** | **0.1513** |
| XGBoost ✅ | `n_estimators=150, lr=0.08, max_depth=5, n_jobs=-1` | 0.7567 | 0.7235 | 0.8354 | 0.5568 | 0.1763 |

> ✅ **Selected (Phase 4.5 override):** `live_win_probability_xgboost.joblib`  
> **Phase 4.5 re-verified score:** Accuracy 0.7915, ROC-AUC 0.8715, Log Loss 0.4357, Brier 0.1417  
> *(Note: MODEL_COMPARISON.md selected Random Forest as best, but Phase 4.5 switched to XGBoost — backend uses XGBoost)*

---

### Task 3: Final Score Prediction (1st innings regression)

**Categorical features:** `['batting_team', 'bowling_team', 'venue', 'city']`  
**Numerical features:** `['current_score', 'wickets_fallen', 'wickets_in_hand', 'legal_balls_bowled', 'overs_completed', 'balls_remaining', 'current_run_rate', 'runs_last_6_balls', 'runs_last_30_balls', 'wickets_last_30_balls', 'boundaries_so_far', 'partnership_runs']`  
**Target:** `final_score` (innings total runs, continuous)

| Model | Hyperparameters | MAE (runs) | RMSE (runs) | R² |
|---|---|---|---|---|
| Linear Regression | default | 19.24 | 25.48 | 0.4536 |
| Random Forest | `n_estimators=100, max_depth=12, n_jobs=-1` | 19.85 | 27.24 | 0.3754 |
| XGBoost ✅ | `n_estimators=150, lr=0.08, max_depth=5, n_jobs=-1` | 20.21 | 27.13 | 0.3803 |

> ✅ **Selected (Phase 4.5 override):** `score_prediction_xgboost.joblib`  
> **Phase 4.5 re-verified score:** MAE 16.27 runs, RMSE 21.38 runs, R² 0.4485  
> *(Note: MODEL_COMPARISON.md selected Linear Regression as best; Phase 4.5 switched to XGBoost)*

---

### Task 4: Player of the Match (Imbalanced Classification — Experimental)

**Class imbalance:** ~4.6% positive rate.  
**Categorical features:** `['player']`  
**Numerical features:** `['hist_runs', 'hist_balls_faced', 'hist_strike_rate', 'hist_wickets', 'hist_balls_bowled', 'hist_runs_conceded', 'hist_economy', 'hist_pom_count', 'recent_avg_runs_5', 'recent_avg_wickets_5']`  
**Target:** `is_player_of_match` (binary)  
**Class balancing:** Logistic Regression and Random Forest use `class_weight='balanced'`; XGBoost uses `scale_pos_weight = neg_count / pos_count`.

| Model | Hyperparameters | Accuracy | ROC-AUC | PR-AUC |
|---|---|---|---|---|
| Logistic Regression | `class_weight='balanced', max_iter=1000` | 0.6925 | 0.5933 | **0.0645** |
| Random Forest | `n_estimators=100, max_depth=10, class_weight='balanced'` | 0.6481 | 0.5913 | 0.0568 |
| XGBoost ✅ | `n_estimators=100, lr=0.05, max_depth=4, scale_pos_weight=~20.9` | 0.6127 | 0.5866 | 0.0639 |

> ✅ **Selected (Phase 4.5 override):** `player_of_match_xgboost.joblib`  
> **Phase 4.5 re-verified score:** Accuracy 0.6385, ROC-AUC 0.7077, PR-AUC 0.0831  
> ⚠️ **Classified as Experimental** — extremely low PR-AUC due to class imbalance

---

## 8. How to Run

### Prerequisites

```bash
# From project root IPLytics/
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

Backend also requires FastAPI/uvicorn — install from `backend/requirements.txt`:
```bash
pip install -r backend/requirements.txt
```

---

### Running the Full ML Pipeline (from scratch)

The pipeline is modular. You can run phases incrementally:

**Phase 1 — Preprocessing:**
```python
from src.preprocessing import load_raw_datasets, standardize_team_names, clean_matches_data, clean_deliveries_data, save_processed_datasets

df_m, df_d = load_raw_datasets('matches.csv', 'deliveries.csv')
df_m, df_d, _ = standardize_team_names(df_m, df_d)
df_m = clean_matches_data(df_m)
df_d = clean_deliveries_data(df_d)
save_processed_datasets(df_m, df_d, 'data/processed/')
```

**Phase 2 — Analytics (optional, generates processed stats CSVs):**
```python
from src.analytics import calculate_team_statistics, calculate_venue_statistics
# See src/analytics.py for full function list
```

**Phase 3 — Build ML Datasets:**
```python
import pandas as pd
from src.ml_data_builder import build_and_save_ml_datasets

df_m = pd.read_csv('data/processed/matches_clean.csv', dtype={'season': str})
df_d = pd.read_csv('data/processed/deliveries_clean.csv')
build_and_save_ml_datasets(df_m, df_d, output_dir='data/ml/')
```

**Phase 4 — Train Models:**
```python
import pandas as pd
from src.model_training import (
    build_match_winner_models, build_live_win_probability_models,
    build_score_prediction_models, build_player_of_match_models
)

df_mw = pd.read_csv('data/ml/match_winner_dataset.csv', dtype={'season': str})
df_lwp = pd.read_csv('data/ml/live_win_probability_dataset.csv', dtype={'season': str})
df_sp = pd.read_csv('data/ml/score_prediction_dataset.csv', dtype={'season': str})
df_pom = pd.read_csv('data/ml/player_of_match_dataset.csv', dtype={'season': str})

build_match_winner_models(df_mw, models_dir='models/')
build_live_win_probability_models(df_lwp, models_dir='models/')
build_score_prediction_models(df_sp, models_dir='models/')
build_player_of_match_models(df_pom, models_dir='models/')
```

---

### Running the FastAPI Backend

```bash
# From project root (IPLytics/)
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health check: http://127.0.0.1:8000/health

**On startup**, `backend/main.py` calls:
1. `load_all_models()` — loads 4 `.joblib` artifacts into memory (`MODELS` dict in `model_loader.py`)
2. `load_analytics_data()` — loads 4 processed CSVs into `DATASETS` dict
3. `load_simulator_data()` — pre-indexes 2nd innings deliveries by match_id for simulation

---

### Running the Frontend

```bash
cd frontend
npm install
npm run dev     # Vite dev server at http://localhost:5173
```

---

## 9. Backend API Endpoints

| Method | Endpoint | Description | Loaded From |
|---|---|---|---|
| GET | `/` | Root status | — |
| GET | `/health` | All 4 model loading status | All `.joblib` artifacts |
| POST | `/predict/match-winner` | Pre-match winner probabilities | `match_winner_logistic_regression.joblib` |
| POST | `/predict/live-win-probability` | Live 2nd innings win probability | `live_win_probability_xgboost.joblib` |
| POST | `/predict/score` | 1st innings final score prediction | `score_prediction_xgboost.joblib` |
| POST | `/predict/player-of-match` | POM candidate probability (Experimental) | `player_of_match_xgboost.joblib` |
| GET | `/teams` | Standardized IPL teams list | `team_statistics.csv` |
| GET | `/teams/{team_name}` | Team historical stats | `team_statistics.csv` |
| GET | `/players` | Paginated player stats (`search`, `limit`, `offset` params) | `player_statistics.csv` |
| GET | `/players/{player_name}` | Individual player stats | `player_statistics.csv` |
| GET | `/head-to-head/{team1}/{team2}` | Order-independent H2H record | `matches_clean.csv` |
| GET | `/matches` | Filtered matches (`season`, `team`, `venue`, `limit` params) | `matches_clean.csv` |
| GET | `/matches/{match_id}` | Match detail by ID | `matches_clean.csv` |
| GET | `/venues` | All venue stats | `venue_statistics.csv` |
| GET | `/venues/{venue_name}` | Specific venue stats | `venue_statistics.csv` |
| GET | `/simulator/matches` | List of simulatable 2nd innings matches | `matches_clean.csv` + `deliveries_clean.csv` |
| POST | `/simulator/start/{match_id}` | Initialize chase simulation, returns `simulation_id` | `live_win_probability_xgboost.joblib` |
| POST | `/simulator/{simulation_id}/step` | Advance simulation 1 delivery, returns live ML probability | `live_win_probability_xgboost.joblib` |
| POST | `/simulator/{simulation_id}/reset` | Reset simulation to 0/0 state | `live_win_probability_xgboost.joblib` |

---

## 10. Python Dependencies

From `requirements.txt`:
```
pandas>=2.0.0
numpy>=1.24.0
matplotlib>=3.7.0
seaborn>=0.12.0
scikit-learn>=1.2.0
xgboost>=1.7.0
joblib>=1.2.0
```

Backend additionally requires (from `backend/requirements.txt`):
```
fastapi
uvicorn
pydantic
```

Frontend: React + TypeScript via Vite (see `frontend/package.json`).

---

## 11. Key Architectural Notes

1. **Self-contained model pipelines:** Every `.joblib` artifact is a complete `sklearn.pipeline.Pipeline` containing both the `ColumnTransformer` preprocessor and the estimator. You can call `pipe.predict()` or `pipe.predict_proba()` directly with a raw feature DataFrame — no external scaling needed.

2. **No data leakage:** The feature engineering pipeline strictly processes data chronologically. Historical tracking dicts are updated AFTER computing features for each match/delivery.

3. **Season dtype:** The `season` column MUST always be read with `dtype={'season': str}` when loading CSVs via pandas. Season values include mixed formats (`'2007/08'`, `'2009'`, `'2020/21'`) that cause `DtypeWarning` if read as numeric.

4. **Live Win Probability as primary real-time engine:** The XGBoost live win probability model is used by both the direct prediction endpoint AND the historical match simulator. The simulator replays real historical deliveries from `deliveries_clean.csv` ball-by-ball, calling the ML model after each one.

5. **Simulator sessions are in-memory:** `SIMULATION_SESSIONS` dict in `simulator_service.py` is process-local. Sessions are not persisted to disk. Each simulation ID is `sim_{match_id}_{uuid_hex[:8]}`.

6. **CORS:** Backend allows all origins (`"*"`) — tighten for production.

7. **Player of Match is experimental:** PR-AUC of 0.0831 (initial training) under ~4.6% class imbalance. Should not be treated as production-grade.

---

## 12. Current Issues / Known Limitations

1. **Match Winner model accuracy is low (~52–67%)** — pre-match prediction is inherently hard with limited pre-match signals. The model has an ROC-AUC of ~0.70 which is modest.

2. **Score Prediction R² is ~0.45** — the model explains only ~45% of variance in final innings scores. Early-innings predictions are especially noisy.

3. **Player of Match severely class-imbalanced** — PR-AUC 0.0831 is near-random for the positive class. This model is officially marked Experimental in the `PlayerOfMatchResponse` schema note.

4. **Simulator sessions are not persistent** — if the backend restarts, all active simulation sessions are lost. There is no database or file-based session storage.

5. **No authentication on any endpoint** — the API is fully open; CORS wildcard `"*"` is configured.

6. **`model_loader.py` MODEL_PATHS are hardcoded to specific `.joblib` filenames** — changing the selected best model requires editing `model_loader.py` directly:
   ```python
   MODEL_PATHS = {
       "match_winner":        "models/match_winner/match_winner_logistic_regression.joblib",
       "live_win_probability": "models/live_win_probability/live_win_probability_xgboost.joblib",
       "score_prediction":    "models/score_prediction/score_prediction_xgboost.joblib",
       "player_of_match":     "models/player_of_match/player_of_match_xgboost.joblib"
   }
   ```

7. **MODEL_COMPARISON.md vs PHASE_4_5_VERIFICATION.md discrepancy** — these two reports list different "best" models (e.g., MODEL_COMPARISON selected LR for live win probability, but Phase 4.5 switched to XGBoost). The backend code in `model_loader.py` is the ground truth for what's actually active.

8. **No rate limiting or request queuing** — the live win probability model is called on every simulator step, which could be a bottleneck under concurrent simulations.

---

## 13. Key Code Snippets

### Loading and using any trained model pipeline

```python
import joblib
import pandas as pd

pipe = joblib.load('models/live_win_probability/live_win_probability_xgboost.joblib')

features = pd.DataFrame([{
    'batting_team': 'Chennai Super Kings',
    'bowling_team': 'Mumbai Indians',
    'venue': 'Wankhede Stadium',
    'city': 'Mumbai',
    'current_score': 140,
    'wickets_fallen': 3,
    'wickets_in_hand': 7,
    'legal_balls_bowled': 90,
    'overs_completed': 15.0,
    'balls_remaining': 30,
    'current_run_rate': 9.33,
    'target': 180.0,
    'runs_required': 40,
    'required_run_rate': 8.0,
    'crr_minus_rrr': 1.33,
    'runs_last_6_balls': 10,
    'runs_last_30_balls': 45,
    'wickets_last_30_balls': 1,
    'boundaries_so_far': 12,
    'partnership_runs': 35
}])

probas = pipe.predict_proba(features)[0]
# probas[1] = probability batting team wins
# probas[0] = probability bowling team wins
print(f"Batting team win probability: {probas[1]:.4f}")
```

### Chronological train/test split

```python
TEST_SEASONS = ['2023', '2024']
RANDOM_STATE = 42

df['season'] = df['season'].astype(str)
train_df = df[~df['season'].isin(TEST_SEASONS)].copy()  # 2008–2022
test_df  = df[df['season'].isin(TEST_SEASONS)].copy()   # 2023–2024
```

### Simulator API usage sequence

```bash
# 1. List available simulatable matches
GET /simulator/matches?limit=50

# 2. Start simulation for a specific match
POST /simulator/start/1359544
# → returns {"simulation_id": "sim_1359544_abc12345", "target": 185, ...}

# 3. Step through deliveries (repeat until match_finished=true)
POST /simulator/sim_1359544_abc12345/step
# → returns ball-by-ball state + batting_team_win_probability + bowling_team_win_probability

# 4. Reset simulation to beginning
POST /simulator/sim_1359544_abc12345/reset
```

### Match Winner prediction request body

```json
{
  "team1": "Chennai Super Kings",
  "team2": "Mumbai Indians",
  "venue": "MA Chidambaram Stadium, Chepauk",
  "city": "Chennai",
  "toss_winner": "Chennai Super Kings",
  "toss_decision": "field",
  "team1_historical_win_rate": 0.584,
  "team2_historical_win_rate": 0.558,
  "team1_recent_form_5": 0.600,
  "team2_recent_form_5": 0.400,
  "h2h_team1_wins": 15,
  "h2h_team2_wins": 20,
  "h2h_total_matches": 35,
  "h2h_team1_win_rate": 0.428,
  "team1_venue_win_rate": 0.650,
  "team2_venue_win_rate": 0.450,
  "venue_avg_first_innings_score_historical": 165.0
}
```

---

## 14. Project Phase Summary

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Data Preprocessing & Team Name Standardization | ✅ Complete |
| Phase 2 | EDA, Analytics, Player/Team/Venue Stats Generation | ✅ Complete |
| Phase 3 | Feature Engineering (Pre-Match + Live Ball-by-Ball) + ML Dataset Assembly | ✅ Complete |
| Phase 4 | Model Training (12 pipelines across 4 tasks), Evaluation, MODEL_COMPARISON.md | ✅ Complete |
| Phase 4.5 | Final ML Pipeline Cleanup & Verification — model re-selection & artifact audit | ✅ Complete |
| Phase 5A | FastAPI ML Prediction Endpoints | ✅ Complete |
| Phase 5B | Analytics & Historical Data REST Endpoints | ✅ Complete |
| Phase 5C | Historical Match Simulator (ball-by-ball + live ML engine) | ✅ Complete |
| Frontend | React/TypeScript UI with all prediction + analytics + simulator pages | ✅ Complete |
