# IPLytics

**Data Meets Cricket**

IPLytics is an IPL analytics and machine-learning platform designed to deliver deep cricket insights and predictive analytics.

---

## Current Phase

**Phase 1 — Data Inspection, Validation and Cleaning**

In this phase, raw IPL dataset files (`matches.csv` and `deliveries.csv`) were systematically inspected, validated, and cleaned to establish a reliable foundation for subsequent machine learning models.

### Key Achievements in Phase 1:
- Inspected dataset structures (1,095 matches and 260,920 delivery records covering 17 seasons from 2008 to 2024).
- Verified 100% 1-to-1 match ID alignment between `matches.id` and `deliveries.match_id`.
- Standardized historical team names (`Delhi Daredevils` → `Delhi Capitals`, `Kings XI Punjab` → `Punjab Kings`, `Royal Challengers Bangalore` → `Royal Challengers Bengaluru`).
- Identified and extracted 741 unique player entities across all player roles.
- Imputed missing city data for neutral venues (Dubai, Sharjah).
- Preserved all legitimate IPL match records (ties, super overs, DLS matches, and no-results).
- Created modular Python packages in `src/` (`data_validation.py` and `preprocessing.py`).

---

## Planned ML Modules

In future phases, machine learning models will be trained, evaluated, compared, and the best model for each task will be selected:

1. **Match Winner Prediction**
   - Logistic Regression
   - Random Forest
   - XGBoost

2. **Live Win Probability**
   - Logistic Regression
   - Random Forest
   - XGBoost

3. **Final Score Prediction**
   - Linear Regression
   - Random Forest Regressor
   - XGBoost Regressor

4. **Player of the Match Prediction**
   - Logistic Regression
   - Random Forest
   - XGBoost

---

## Project Structure

```
IPLytics/
│
├── data/
│   ├── raw/
│   │   ├── matches.csv
│   │   └── deliveries.csv
│   │
│   └── processed/
│       ├── matches_clean.csv
│       └── deliveries_clean.csv
│
├── notebooks/
│
├── src/
│   ├── __init__.py
│   ├── data_validation.py
│   └── preprocessing.py
│
├── models/
│
├── backend/
│
├── frontend/
│
├── reports/
│   ├── data_quality_report.csv
│   ├── team_name_mapping.csv
│   └── DATA_SUMMARY.md
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## Setup & Running Data Pipeline

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run Data Inspection & Validation:
   ```python
   from src.data_validation import load_dataset, generate_data_quality_report
   
   matches = load_dataset("data/raw/matches.csv")
   deliveries = load_dataset("data/raw/deliveries.csv")
   report = generate_data_quality_report(matches, deliveries)
   ```

3. Run Preprocessing & Cleaning:
   ```python
   from src.preprocessing import load_raw_datasets, standardize_team_names, clean_matches_data, clean_deliveries_data, save_processed_datasets
   
   df_m, df_d = load_raw_datasets("data/raw/matches.csv", "data/raw/deliveries.csv")
   df_m_std, df_d_std, _ = standardize_team_names(df_m, df_d)
   df_m_clean = clean_matches_data(df_m_std)
   df_d_clean = clean_deliveries_data(df_d_std)
   save_processed_datasets(df_m_clean, df_d_clean, "data/processed")
   ```
