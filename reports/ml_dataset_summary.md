# IPLytics — Phase 3 Machine Learning Datasets Summary

This report summarizes the datasets generated in Phase 3 for subsequent model training in Phase 4.

---

## Dataset Metrics Overview

| ML Prediction Task | Dataset File | Rows Count | Columns Count | Target Variable | Target Class Distribution / Mean | Train Rows (2008–2022) | Test Rows (2023–2024) | Missing Values Count |
|:---|:---|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **1. Match Winner Prediction** | `match_winner_dataset.csv` | `1,090` | `21` | `team1_win` | `1`: 555 (50.9%), `0`: 535 | `946` | `144` | `0` |
| **2. Live Win Probability** | `live_win_probability_dataset.csv` | `125,714` | `23` | `batting_team_wins` | `1`: 65346 (52.0%), `0`: 60368 | `108,883` | `16,831` | `0` |
| **3. Final Score Prediction** | `score_prediction_dataset.csv` | `134,555` | `19` | `final_score` | Mean: `166.4` runs (Range: `67` to `287`) | `116,538` | `18,017` | `0` |
| **4. Player of the Match** | `player_of_match_dataset.csv` | `23,405` | `15` | `is_player_of_match` | `1`: 1090 (4.66%), `0`: 22315 | `20,072` | `3,333` | `0` |

---

## Train / Test Splitting Strategy
- **Chronological Split Policy**:
  - **Training Set**: Seasons `2007/08` through `2022` (Historical past)
  - **Test Set**: Seasons `2023` and `2024` (Unseen future evaluation)
- **Zero Leakage**: Features for every match/delivery/player are derived exclusively from historical occurrences prior to the target prediction point.
