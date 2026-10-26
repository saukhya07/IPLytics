# IPLytics - Phase 1 Data Summary & Inspection Report

## Executive Summary
This report summarizes the data inspection, validation, and cleaning results for **IPLytics** Phase 1.
All operations were conducted using actual workspace data (`matches.csv` and `deliveries.csv`) without inventing values or artificially removing records.

---

## 1. Dataset Dimensions
- **matches.csv**: `1095` rows, `20` columns
- **deliveries.csv**: `260920` rows, `17` columns

---

## 2. Column Information & Data Types

### matches.csv Columns (20)
| # | Column Name | Data Type | Non-Null Count | Missing Count | Missing % |
|---|---|---|---|---|---|
| 1 | `id` | `int64` | 1095 | 0 | 0.00% |
| 2 | `season` | `str` | 1095 | 0 | 0.00% |
| 3 | `city` | `str` | 1044 | 51 | 4.66% |
| 4 | `date` | `str` | 1095 | 0 | 0.00% |
| 5 | `match_type` | `str` | 1095 | 0 | 0.00% |
| 6 | `player_of_match` | `str` | 1090 | 5 | 0.46% |
| 7 | `venue` | `str` | 1095 | 0 | 0.00% |
| 8 | `team1` | `str` | 1095 | 0 | 0.00% |
| 9 | `team2` | `str` | 1095 | 0 | 0.00% |
| 10 | `toss_winner` | `str` | 1095 | 0 | 0.00% |
| 11 | `toss_decision` | `str` | 1095 | 0 | 0.00% |
| 12 | `winner` | `str` | 1090 | 5 | 0.46% |
| 13 | `result` | `str` | 1095 | 0 | 0.00% |
| 14 | `result_margin` | `float64` | 1076 | 19 | 1.74% |
| 15 | `target_runs` | `float64` | 1092 | 3 | 0.27% |
| 16 | `target_overs` | `float64` | 1092 | 3 | 0.27% |
| 17 | `super_over` | `str` | 1095 | 0 | 0.00% |
| 18 | `method` | `str` | 21 | 1074 | 98.08% |
| 19 | `umpire1` | `str` | 1095 | 0 | 0.00% |
| 20 | `umpire2` | `str` | 1095 | 0 | 0.00% |

### deliveries.csv Columns (17)
| # | Column Name | Data Type | Non-Null Count | Missing Count | Missing % |
|---|---|---|---|---|---|
| 1 | `match_id` | `int64` | 260920 | 0 | 0.00% |
| 2 | `inning` | `int64` | 260920 | 0 | 0.00% |
| 3 | `batting_team` | `str` | 260920 | 0 | 0.00% |
| 4 | `bowling_team` | `str` | 260920 | 0 | 0.00% |
| 5 | `over` | `int64` | 260920 | 0 | 0.00% |
| 6 | `ball` | `int64` | 260920 | 0 | 0.00% |
| 7 | `batter` | `str` | 260920 | 0 | 0.00% |
| 8 | `bowler` | `str` | 260920 | 0 | 0.00% |
| 9 | `non_striker` | `str` | 260920 | 0 | 0.00% |
| 10 | `batsman_runs` | `int64` | 260920 | 0 | 0.00% |
| 11 | `extra_runs` | `int64` | 260920 | 0 | 0.00% |
| 12 | `total_runs` | `int64` | 260920 | 0 | 0.00% |
| 13 | `extras_type` | `str` | 14125 | 246795 | 94.59% |
| 14 | `is_wicket` | `int64` | 260920 | 0 | 0.00% |
| 15 | `player_dismissed` | `str` | 12950 | 247970 | 95.04% |
| 16 | `dismissal_kind` | `str` | 12950 | 247970 | 95.04% |
| 17 | `fielder` | `str` | 9354 | 251566 | 96.41% |

---

## 3. Missing Value Analysis
- **matches.csv**:
  - `city`: 51 missing values (4.66%) — *Resolved via venue imputation (Dubai & Sharjah stadiums)*.
  - `player_of_match`: 5 missing values (0.46%) — *Corresponds to 5 Abandoned / No Result matches*.
  - `winner`: 5 missing values (0.46%) — *Corresponds to 5 Abandoned / No Result matches*.
  - `result_margin`: 19 missing values (1.74%) — *5 No Result matches + 14 Tied matches (decided via Super Over)*.
  - `target_runs` & `target_overs`: 3 missing values (0.27%) — *Abandoned matches before 1st innings target set*.
  - `method`: 1074 missing values (98.08%) — *populated only when Duck-Lewis-Stern (D/L) method is applied (21 matches)*.
- **deliveries.csv**:
  - `extras_type`: 246,795 missing (94.59%) — *populated only when extra runs (wides, noballs, byes, legbyes, penalty) are conceded*.
  - `player_dismissed` & `dismissal_kind`: 247,970 missing (95.04%) — *populated only when a wicket falls*.
  - `fielder`: 251,566 missing (96.41%) — *populated only when a fielder is involved in the dismissal*.

---

## 4. Duplicate Information
- **matches.csv**:
  - Duplicate rows: `0`
  - Duplicate match IDs (`id`): `0`
- **deliveries.csv**:
  - Duplicate rows: `0`
  - Unique match IDs (`match_id`): `1095`

---

## 5. Seasons Coverage
- Total unique seasons: `17`
- Seasons: `2007/08, 2009, 2009/10, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020/21, 2021, 2022, 2023, 2024`
- Match Date Range: `2008-04-18` to `2024-05-26`

---

## 6. Teams Analysis
- **Original Unique Teams (19)**:
  `Chennai Super Kings, Deccan Chargers, Delhi Capitals, Delhi Daredevils, Gujarat Lions, Gujarat Titans, Kings XI Punjab, Kochi Tuskers Kerala, Kolkata Knight Riders, Lucknow Super Giants, Mumbai Indians, Pune Warriors, Punjab Kings, Rajasthan Royals, Rising Pune Supergiant, Rising Pune Supergiants, Royal Challengers Bangalore, Royal Challengers Bengaluru, Sunrisers Hyderabad`

- **Standardized Unique Teams (15)**:
  `Chennai Super Kings, Deccan Chargers, Delhi Capitals, Gujarat Lions, Gujarat Titans, Kochi Tuskers Kerala, Kolkata Knight Riders, Lucknow Super Giants, Mumbai Indians, Pune Warriors, Punjab Kings, Rajasthan Royals, Rising Pune Supergiant, Royal Challengers Bengaluru, Sunrisers Hyderabad`

---

## 7. Venues & Cities
- **Unique Venues**: `58`
- **Unique Cities (Raw)**: `36`
- **Unique Cities (Cleaned/Imputed)**: `36`

---

## 8. Match Types & Results
- **Match Types Breakdown**:
  - `League`: 1029
  - `Final`: 17
  - `Qualifier 1`: 14
  - `Qualifier 2`: 14
  - `Eliminator`: 11
  - `Semi Final`: 6
  - `Elimination Final`: 3
  - `3rd Place Play-Off`: 1

- **Result Types Breakdown**:
  - `wickets`: 578
  - `runs`: 498
  - `tie`: 14
  - `no result`: 5

- **Special Match Categories**:
  - **No Result Matches**: `5`
  - **Tied Matches**: `14`
  - **Super Over Matches**: `14` (100% correlation with tied matches)
  - **DLS / Method Matches**: `21`

---

## 9. Match-ID Validation
- Total matches in `matches.csv`: `1095`
- Total unique delivery match IDs in `deliveries.csv`: `1095`
- Delivery match IDs not in `matches.csv`: `0`
- Matches with no deliveries: `0`
- Valid relationships: `1095` / `1095` (100% 1-to-1 match coverage)
- Invalid relationships: `0`

---

## 10. Player Information Available
- **Total Unique Players Extracted**: `741`
- **Breakdown by Column**:
  - `batter`: `673`
  - `bowler`: `530`
  - `non_striker`: `663`
  - `player_dismissed`: `629`
  - `fielder`: `607`
  - `player_of_match`: `291`
- **Naming Inconsistencies / Duplicate Names**: `0` exact case/whitespace duplicates found. All 741 names are clean.

---

## 11. Team Name Mappings Applied
| Original Name | Standardized Name | Affected Matches | Affected Deliveries |
|---|---|---|---|
| `Delhi Daredevils` | `Delhi Capitals` | 161 | 37511 |
| `Kings XI Punjab` | `Punjab Kings` | 190 | 45129 |
| `Royal Challengers Bangalore` | `Royal Challengers Bengaluru` | 240 | 56563 |
| `Rising Pune Supergiants` | `Rising Pune Supergiant` | 14 | 3195 |

---

## 12. Data Quality Issues Identified
1. **Missing Cities**: 51 match records had NaN for `city`.
2. **Missing Winners / Margins**: 5 No Result matches missing `winner`/`player_of_match`; 14 tied matches missing `result_margin`.
3. **Historical Franchise Team Names**: Historical renames present across seasons (`Delhi Daredevils`, `Kings XI Punjab`, `Royal Challengers Bangalore`).

---

## 13. Cleaning Decisions Made
1. **City Imputation**: Imputed missing `city` for 33 matches at *Dubai International Cricket Stadium* to `Dubai` and 18 matches at *Sharjah Cricket Stadium* to `Sharjah`.
2. **Team Name Standardization**: Converted historical team names to present names per mandate without altering unrelated teams:
   - `Delhi Daredevils` → `Delhi Capitals`
   - `Kings XI Punjab` → `Punjab Kings`
   - `Royal Challengers Bangalore` → `Royal Challengers Bengaluru`
3. **Preservation of All Records**: No matches or deliveries were dropped. Tied, Super Over, DLS, and No Result matches were preserved to maintain dataset integrity.
4. **No Feature Engineering / Targets**: Kept data strictly in cleaned tabular format without creating ML feature vectors or target labels in Phase 1.
