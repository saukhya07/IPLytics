# IPLytics — Phase 3 Feature Dictionary

This document details every feature engineering column across all four Machine Learning datasets in **IPLytics**.

---

## 1. Match Winner Dataset (`match_winner_dataset.csv`)
- **Target Variable**: `team1_win` (1 if Team 1 wins, 0 if Team 2 wins)

| Feature Name | Type | Availability | Leakage Risk | Description & Calculation Method |
|:---|:---:|:---:|:---:|:---|
| `season` | Categorical | Pre-Match | None | IPL Season year/range. |
| `venue` | Categorical | Pre-Match | None | Match venue name. |
| `city` | Categorical | Pre-Match | None | City hosting the match. |
| `team1` | Categorical | Pre-Match | None | Name of Team 1 (first listed). |
| `team2` | Categorical | Pre-Match | None | Name of Team 2 (second listed). |
| `toss_winner` | Categorical | Pre-Match | None | Team winning the toss before match start. |
| `toss_decision` | Categorical | Pre-Match | None | Toss decision (`field` or `bat`). |
| `team1_historical_win_rate` | Numerical | Pre-Match | None | Cumulative win % of Team 1 in all prior completed matches. |
| `team2_historical_win_rate` | Numerical | Pre-Match | None | Cumulative win % of Team 2 in all prior completed matches. |
| `team1_recent_form_5` | Numerical | Pre-Match | None | Win % of Team 1 in its previous 5 completed matches. |
| `team2_recent_form_5` | Numerical | Pre-Match | None | Win % of Team 2 in its previous 5 completed matches. |
| `h2h_team1_wins` | Numerical | Pre-Match | None | Total head-to-head wins by Team 1 prior to current match. |
| `h2h_team2_wins` | Numerical | Pre-Match | None | Total head-to-head wins by Team 2 prior to current match. |
| `h2h_total_matches` | Numerical | Pre-Match | None | Total head-to-head meetings between Team 1 & 2 prior to current match. |
| `h2h_team1_win_rate` | Numerical | Pre-Match | None | Historical head-to-head win % of Team 1 against Team 2. |
| `team1_venue_win_rate` | Numerical | Pre-Match | None | Historical win % of Team 1 at the target venue prior to current match. |
| `team2_venue_win_rate` | Numerical | Pre-Match | None | Historical win % of Team 2 at the target venue prior to current match. |
| `venue_avg_first_innings_score_historical` | Numerical | Pre-Match | None | Average 1st innings score at venue in all prior completed matches. |

---

## 2. Live Win Probability Dataset (`live_win_probability_dataset.csv`)
- **Target Variable**: `batting_team_wins` (1 if chasing batting team wins, 0 if bowling team wins)

| Feature Name | Type | Availability | Leakage Risk | Description & Calculation Method |
|:---|:---:|:---:|:---:|:---|
| `current_score` | Numerical | In-Match | None | Cumulative total runs scored in 2nd innings immediately after current ball. |
| `wickets_fallen` | Numerical | In-Match | None | Cumulative wickets fallen in 2nd innings immediately after current ball. |
| `wickets_in_hand` | Numerical | In-Match | None | `10 - wickets_fallen`. |
| `legal_balls_bowled` | Numerical | In-Match | None | Cumulative legal deliveries bowled (excludes wides & noballs). |
| `overs_completed` | Numerical | In-Match | None | `legal_balls_bowled / 6.0`. |
| `balls_remaining` | Numerical | In-Match | None | `max(0, 120 - legal_balls_bowled)`. |
| `current_run_rate` | Numerical | In-Match | None | `current_score / overs_completed`. |
| `target` | Numerical | Pre/In-Match | None | Total target runs required to win (1st innings total + 1). |
| `runs_required` | Numerical | In-Match | None | `max(0, target - current_score)`. |
| `required_run_rate` | Numerical | In-Match | None | `runs_required / (balls_remaining / 6.0)`. |
| `crr_minus_rrr` | Numerical | In-Match | None | `current_run_rate - required_run_rate`. |
| `runs_last_6_balls` | Numerical | In-Match | None | Runs scored in the previous 6 delivery rows. |
| `runs_last_30_balls` | Numerical | In-Match | None | Runs scored in the previous 30 delivery rows. |
| `wickets_last_30_balls` | Numerical | In-Match | None | Wickets fallen in the previous 30 delivery rows. |
| `boundaries_so_far` | Numerical | In-Match | None | Total fours and sixes hit in current innings up to current ball. |
| `partnership_runs` | Numerical | In-Match | None | Runs scored in current batting partnership. |

---

## 3. Score Prediction Dataset (`score_prediction_dataset.csv`)
- **Target Variable**: `final_score` (Actual total runs scored by 1st innings batting team)

| Feature Name | Type | Availability | Leakage Risk | Description & Calculation Method |
|:---|:---:|:---:|:---:|:---|
| `current_score` | Numerical | In-Match | None | Cumulative total runs scored in 1st innings immediately after current ball. |
| `wickets_fallen` | Numerical | In-Match | None | Cumulative wickets fallen in 1st innings immediately after current ball. |
| `wickets_in_hand` | Numerical | In-Match | None | `10 - wickets_fallen`. |
| `legal_balls_bowled` | Numerical | In-Match | None | Cumulative legal deliveries bowled in 1st innings. |
| `overs_completed` | Numerical | In-Match | None | `legal_balls_bowled / 6.0`. |
| `balls_remaining` | Numerical | In-Match | None | `max(0, 120 - legal_balls_bowled)`. |
| `current_run_rate` | Numerical | In-Match | None | `current_score / overs_completed`. |
| `runs_last_6_balls` | Numerical | In-Match | None | Runs scored in previous 6 deliveries. |
| `runs_last_30_balls` | Numerical | In-Match | None | Runs scored in previous 30 deliveries. |
| `wickets_last_30_balls` | Numerical | In-Match | None | Wickets fallen in previous 30 deliveries. |
| `boundaries_so_far` | Numerical | In-Match | None | Cumulative boundaries hit in 1st innings up to current ball. |
| `partnership_runs` | Numerical | In-Match | None | Runs scored in current batting partnership. |

---

## 4. Player of the Match Dataset (`player_of_match_dataset.csv`)
- **Target Variable**: `is_player_of_match` (1 if player won Player of Match, 0 otherwise)

| Feature Name | Type | Availability | Leakage Risk | Description & Calculation Method |
|:---|:---:|:---:|:---:|:---|
| `hist_runs` | Numerical | Pre-Match | None | Total career IPL runs scored by player prior to current match. |
| `hist_balls_faced` | Numerical | Pre-Match | None | Total career legal balls faced prior to current match. |
| `hist_strike_rate` | Numerical | Pre-Match | None | Career batting strike rate prior to current match. |
| `hist_wickets` | Numerical | Pre-Match | None | Total career bowler wickets taken prior to current match. |
| `hist_balls_bowled` | Numerical | Pre-Match | None | Total career legal balls bowled prior to current match. |
| `hist_runs_conceded` | Numerical | Pre-Match | None | Total career runs conceded prior to current match. |
| `hist_economy` | Numerical | Pre-Match | None | Career bowling economy rate prior to current match. |
| `hist_pom_count` | Numerical | Pre-Match | None | Total previous Player of the Match awards won prior to current match. |
| `recent_avg_runs_5` | Numerical | Pre-Match | None | Average runs scored in previous 5 matches prior to current match. |
| `recent_avg_wickets_5` | Numerical | Pre-Match | None | Average wickets taken in previous 5 matches prior to current match. |
