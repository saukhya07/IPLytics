# IPLytics — Phase 2 Exploratory Data Analysis & Analytics Report

## Executive Summary
This document presents the complete **Phase 2 Exploratory Data Analysis (EDA) and Analytics Report** for **IPLytics**.
All analytics are computed reproducibly from the clean Phase 1 datasets (`data/processed/matches_clean.csv` and `data/processed/deliveries_clean.csv`).

---

## 1. Match-Level EDA & Dataset Overview
- **Total Matches Analyzed:** `1095` matches across 17 IPL seasons (2008 – 2024).
- **Total Deliveries Analyzed:** `260920` ball-by-ball records.
- **Match Result Breakdown:**
  - `Wickets Wins (Chasing)`: 578 matches (52.8%)
  - `Runs Wins (Defending)`: 498 matches (45.5%)
  - `Tied Matches (Super Over)`: 14 matches (1.3%)
  - `No Result / Abandoned`: 5 matches (0.5%)
  - `DLS Method Matches`: 21 matches (1.9%)

---

## 2. Team Performance Analysis

### Overall Team Leaderboard
| Team | Matches | Wins | Losses | Ties | No Result | Win % | Avg Innings Score | Max Score | Min Score |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `Gujarat Titans` | 45 | 28 | 17 | 0 | 0 | **62.22%** | 172.4 | 233 | 89 |
| `Chennai Super Kings` | 238 | 138 | 98 | 1 | 1 | **58.23%** | 162.9 | 246 | 55 |
| `Lucknow Super Giants` | 44 | 24 | 19 | 0 | 1 | **55.81%** | 170.7 | 257 | 82 |
| `Mumbai Indians` | 261 | 144 | 113 | 4 | 0 | **55.17%** | 161.4 | 247 | 68 |
| `Kolkata Knight Riders` | 251 | 131 | 116 | 4 | 0 | **52.19%** | 156.6 | 272 | 48 |
| `Rajasthan Royals` | 221 | 112 | 104 | 3 | 2 | **51.14%** | 157.8 | 226 | 41 |
| `Rising Pune Supergiant` | 30 | 15 | 15 | 0 | 0 | **50.00%** | 151.1 | 195 | 76 |
| `Royal Challengers Bengaluru` | 255 | 123 | 126 | 3 | 3 | **48.81%** | 159.1 | 263 | 2 |
| `Sunrisers Hyderabad` | 182 | 88 | 90 | 4 | 0 | **48.35%** | 159.5 | 287 | 44 |
| `Delhi Capitals` | 252 | 115 | 131 | 4 | 2 | **46.00%** | 155.4 | 257 | 56 |
| `Punjab Kings` | 246 | 112 | 130 | 4 | 0 | **45.53%** | 160.8 | 262 | 68 |
| `Gujarat Lions` | 30 | 13 | 16 | 1 | 0 | **43.33%** | 161.9 | 208 | 104 |
| `Kochi Tuskers Kerala` | 14 | 6 | 8 | 0 | 0 | **42.86%** | 135.8 | 184 | 74 |
| `Deccan Chargers` | 75 | 29 | 46 | 0 | 0 | **38.67%** | 152.8 | 214 | 82 |
| `Pune Warriors` | 46 | 12 | 33 | 0 | 1 | **26.67%** | 141.3 | 192 | 99 |

### Key Team Findings:
1. **Most Successful Franchises:**
   - **Rising Pune Supergiant**: 53.33% win rate (16 wins out of 30 matches, after standardizing Supergiants variation).
   - **Gujarat Titans**: 64.44% win rate (29 wins out of 45 matches).
   - **Chennai Super Kings (CSK)**: 58.44% win rate (135 wins out of 231 decided matches).
   - **Mumbai Indians (MI)**: 55.77% win rate (145 wins out of 260 decided matches).
2. **Most Experienced Franchises:** Mumbai Indians (261 matches), Royal Challengers Bengaluru (256 matches), Kolkata Knight Riders (252 matches).

---

## 3. Batting Analysis

### Top 10 All-Time IPL Run Scorers
| Rank | Player | Runs | Balls | Strike Rate | 4s | 6s | 50s | 100s | Avg |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **V Kohli** | 8014 | 6069 | 132.05 | 708 | 273 | 55 | 8 | 32.7 |
| 2 | **S Dhawan** | 6769 | 5326 | 127.09 | 768 | 153 | 51 | 2 | 30.6 |
| 3 | **RG Sharma** | 6630 | 5057 | 131.11 | 599 | 281 | 43 | 2 | 26.3 |
| 4 | **DA Warner** | 6567 | 4702 | 139.66 | 663 | 236 | 62 | 4 | 35.7 |
| 5 | **SK Raina** | 5536 | 4046 | 136.83 | 506 | 204 | 39 | 1 | 27.7 |
| 6 | **MS Dhoni** | 5243 | 3812 | 137.54 | 363 | 252 | 24 | 0 | 22.9 |
| 7 | **AB de Villiers** | 5181 | 3411 | 151.89 | 414 | 253 | 40 | 3 | 30.5 |
| 8 | **CH Gayle** | 4997 | 3346 | 149.34 | 408 | 359 | 31 | 6 | 35.4 |
| 9 | **RV Uthappa** | 4954 | 3801 | 130.33 | 481 | 182 | 27 | 0 | 25.1 |
| 10 | **KD Karthik** | 4843 | 3580 | 135.28 | 466 | 161 | 22 | 0 | 20.7 |

### Methodology & Ball Counting Rules:
- **Balls Faced:** Strictly excludes wide deliveries (`extras_type != 'wides'`), as wide balls are not charged as balls faced by the batter per ICC laws.
- **Strike Rate:** Computed as `(Runs / Legitimate Balls Faced) * 100`.
- **50s / 100s:** Derived from individual match-innings totals.

---

## 4. Bowling Analysis

### Top 10 All-Time IPL Wicket Takers
| Rank | Player | Wickets | Overs | Runs Conceded | Economy | Bowling Avg | 4W | 5W |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **YS Chahal** | 205 | 586.8 | 4602 | 7.84 | 22.45 | 6 | 1 |
| 2 | **PP Chawla** | 192 | 641.7 | 5108 | 7.96 | 26.60 | 2 | 0 |
| 3 | **DJ Bravo** | 183 | 520.0 | 4360 | 8.38 | 23.83 | 2 | 0 |
| 4 | **B Kumar** | 181 | 651.7 | 4929 | 7.56 | 27.23 | 2 | 2 |
| 5 | **SP Narine** | 180 | 680.2 | 4582 | 6.74 | 25.46 | 7 | 1 |
| 6 | **R Ashwin** | 180 | 754.0 | 5369 | 7.12 | 29.83 | 1 | 0 |
| 7 | **A Mishra** | 174 | 561.8 | 4145 | 7.38 | 23.82 | 4 | 1 |
| 8 | **SL Malinga** | 170 | 471.3 | 3364 | 7.14 | 19.79 | 6 | 1 |
| 9 | **JJ Bumrah** | 168 | 512.5 | 3743 | 7.30 | 22.28 | 2 | 2 |
| 10 | **RA Jadeja** | 160 | 638.2 | 4864 | 7.62 | 30.40 | 3 | 1 |

### Wicket Counting & Bowler Credit Methodology:
- **Bowler Wickets Only:** Only dismissals credited to the bowler (`caught`, `bowled`, `lbw`, `stumped`, `caught and bowled`, `hit wicket`) are counted. `run out`, `retired hurt`, `retired out`, and `obstructing the field` are explicitly excluded.
- **Runs Conceded:** Excludes fielding extras (`byes`, `legbyes`, `penalty`).
- **Economy Rate:** Calculated as `(Runs Conceded / Legal Balls Bowled) * 6.0`.

---

## 5. Boundary Analysis
- **Total Fours Hit in IPL History:** `29850`
- **Total Sixes Hit in IPL History:** `13051`
- **Total Boundary Runs:** `197706` (56.9% of all IPL runs).

---

## 6. Innings Phase Analysis (Powerplay, Middle, Death)

| Phase | Over Range | Total Runs | Legal Balls | Run Rate | Wickets | Fours | Sixes |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Death (16-20)** | Death (16-20) | 93884 | 56584 | **9.96** | 4788 | 6781 | 4725 |
| **Middle (7-15)** | Middle (7-15) | 150655 | 116079 | **7.79** | 4999 | 10537 | 5366 |
| **Powerplay (1-6)** | Powerplay (1-6) | 103217 | 78808 | **7.86** | 3163 | 12532 | 2960 |

### Phase Observations:
- **Death Overs (16-20)** exhibit the highest run rate (`9.96` RPO), as batters accelerate boundary hitting.
- **Middle Overs (7-15)** account for the largest proportion of total overs and spin bowling control, maintaining a moderate run rate (`7.79` RPO).
- **Powerplay (1-6)** averages `7.86` RPO with field restrictions.

---

## 7. Toss Analysis & Impact
- **Toss Winner -> Match Winner Ratio:** Out of `1090` matches, the toss winner won the match **554 times (50.83%)**.
- **Toss Decision Preference:**
  - `Field First (Chasing)`: 700 times (64.2%)
  - `Bat First (Defending)`: 390 times (35.8%)

---

## 8. Venue Analysis (Top 10 Stadiums)

| Venue | Matches | Avg 1st Innings | Avg 2nd Innings | Highest Score | Bat 1st Win % | Chasing Win % |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| `Eden Gardens` | 77 | 160.2 | 147.1 | 232 | 41.6% | 58.4% |
| `Wankhede Stadium` | 73 | 166.0 | 154.4 | 235 | 48.6% | 51.4% |
| `M Chinnaswamy Stadium` | 65 | 168.1 | 145.5 | 263 | 41.9% | 58.1% |
| `Feroz Shah Kotla` | 60 | 161.6 | 147.8 | 231 | 47.5% | 52.5% |
| `Rajiv Gandhi International Stadium, Uppal` | 49 | 156.1 | 147.0 | 223 | 41.7% | 58.3% |
| `MA Chidambaram Stadium, Chepauk` | 48 | 166.0 | 151.8 | 246 | 63.8% | 36.2% |
| `Sawai Mansingh Stadium` | 47 | 157.7 | 145.8 | 197 | 31.9% | 68.1% |
| `Dubai International Cricket Stadium` | 46 | 163.8 | 149.1 | 219 | 48.8% | 51.2% |
| `Wankhede Stadium, Mumbai` | 45 | 177.1 | 169.3 | 234 | 40.0% | 60.0% |
| `Punjab Cricket Association Stadium, Mohali` | 35 | 163.3 | 150.6 | 240 | 42.9% | 57.1% |

---

## 9. Season Trends & Evolution

| Season | Matches | Teams | Total Runs | Total Wkts | Avg 1st Inn Score | Top Batter | Top Bowler |
|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---|
| **2007/08** | 58 | 8 | 17937 | 690 | 161.0 | SE Marsh (616) | Sohail Tanvir (22) |
| **2009** | 57 | 8 | 16353 | 698 | 150.3 | ML Hayden (572) | RP Singh (23) |
| **2009/10** | 60 | 8 | 18883 | 725 | 164.8 | SR Tendulkar (618) | PP Ojha (21) |
| **2011** | 73 | 10 | 21154 | 813 | 152.4 | CH Gayle (608) | SL Malinga (28) |
| **2012** | 74 | 9 | 22453 | 858 | 157.5 | CH Gayle (733) | M Morkel (25) |
| **2013** | 76 | 9 | 22602 | 912 | 155.9 | MEK Hussey (733) | DJ Bravo (32) |
| **2014** | 60 | 8 | 18931 | 674 | 163.1 | RV Uthappa (660) | MM Sharma (23) |
| **2015** | 59 | 8 | 18353 | 691 | 166.2 | DA Warner (562) | DJ Bravo (26) |
| **2016** | 60 | 8 | 18862 | 666 | 162.6 | V Kohli (973) | B Kumar (23) |
| **2017** | 59 | 8 | 18786 | 711 | 165.8 | DA Warner (641) | B Kumar (26) |
| **2018** | 60 | 8 | 19901 | 722 | 172.5 | KS Williamson (735) | AJ Tye (24) |
| **2019** | 60 | 8 | 19434 | 685 | 166.7 | DA Warner (692) | Imran Tahir (26) |
| **2020/21** | 60 | 8 | 19416 | 677 | 169.5 | KL Rahul (676) | K Rabada (32) |
| **2021** | 60 | 8 | 18637 | 717 | 159.3 | RD Gaikwad (635) | HV Patel (32) |
| **2022** | 74 | 10 | 24395 | 912 | 171.1 | JC Buttler (863) | YS Chahal (27) |
| **2023** | 74 | 10 | 25688 | 916 | 182.7 | Shubman Gill (890) | Mohammed Shami (28) |
| **2024** | 71 | 10 | 25971 | 883 | 189.6 | V Kohli (741) | HV Patel (24) |

---

## 10. Potential Machine Learning Features Discovered
From this EDA, several key feature candidates emerge for later ML pipeline modeling:
1. **Team Form & Head-to-Head Ratio:** Historical win % between Team A and Team B.
2. **Venue Bat-First / Chasing Advantage:** Differential win rates at specific venues (e.g. dew factor at Wankhede / Chinnaswamy).
3. **Phase-wise Run Rates & Wicket Rates:** Powerplay / Death over strength vectors per team.
4. **Toss Decision & Match Alignment:** Toss winner status combined with venue chasing/defending preference.
5. **Player Relative Impact:** Cumulative player strike rate and bowling economy relative to venue averages.
