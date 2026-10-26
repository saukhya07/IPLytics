# IPLytics — FastAPI ML Backend

This directory contains the FastAPI backend for **IPLytics**, exposing all four Machine Learning prediction pipelines, analytics endpoints, and the Historical Match Simulator REST API.

---

## 🚀 Running the FastAPI Server

From the project root (`IPLytics/`):

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Access Interactive API Documentation:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📌 API Endpoints Overview

| Method | Endpoint | Description | Model / Data Source |
|:---|:---|:---|:---|
| `GET` | `/` | Root status check | N/A |
| `GET` | `/health` | Real model loading health check | All 4 Model Artifacts |
| `POST` | `/predict/match-winner` | Pre-match winner prediction & win probabilities | `match_winner_logistic_regression.joblib` |
| `POST` | `/predict/live-win-probability` | Live 2nd innings win probability | `live_win_probability_xgboost.joblib` |
| `POST` | `/predict/score` | 1st innings final score prediction | `score_prediction_xgboost.joblib` |
| `POST` | `/predict/player-of-match` | Player of the Match candidate probability | `player_of_match_xgboost.joblib` |
| `GET` | `/teams` | List of IPL teams | `matches_clean.csv` |
| `GET` | `/teams/{team_name}` | Team historical statistics | `team_statistics.csv` |
| `GET` | `/players` | Paginated player statistics | `player_statistics.csv` |
| `GET` | `/players/{player_name}` | Individual player statistics | `player_statistics.csv` |
| `GET` | `/head-to-head/{team1}/{team2}` | Order-independent H2H record | `matches_clean.csv` |
| `GET` | `/matches` | Filtered historical matches | `matches_clean.csv` |
| `GET` | `/matches/{match_id}` | Detailed match summary | `matches_clean.csv` |
| `GET` | `/venues` | List of IPL venues | `venue_statistics.csv` |
| `GET` | `/venues/{venue_name}` | Detailed venue statistics | `venue_statistics.csv` |
| `GET` | `/simulator/matches` | List simulatable 2nd innings matches | `matches_clean.csv` & `deliveries_clean.csv` |
| `POST` | `/simulator/start/{match_id}` | Start 2nd innings chase simulation | `live_win_probability_xgboost.joblib` |
| `POST` | `/simulator/{sim_id}/step` | Advance chase by 1 real delivery | `live_win_probability_xgboost.joblib` |
| `POST` | `/simulator/{sim_id}/reset` | Reset chase simulation to ball 1 | `live_win_probability_xgboost.joblib` |

---

## 🧪 Sample Simulator Usage

1. **List Simulatable Matches**: `GET /simulator/matches`
2. **Start Simulation**: `POST /simulator/start/1359544` -> returns `simulation_id`
3. **Step Delivery**: `POST /simulator/sim_1359544_abc12345/step` -> advances 1 real ball & calculates live ML win probability
4. **Reset Simulation**: `POST /simulator/sim_1359544_abc12345/reset` -> resets chase state to 0/0 off 0 balls
```
