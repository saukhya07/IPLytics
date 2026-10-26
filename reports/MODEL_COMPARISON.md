# IPLytics — Phase 4 Model Comparison & Evaluation Report

This report documents the training, evaluation, comparison, and selection of Machine Learning models for **IPLytics**.

---

## 1. Task 1: Match Winner Prediction (Classification)
- **Train Split (2008–2022)**: `946` matches
- **Test Split (2023–2024)**: `144` matches (Unseen test set)

### Results Comparison Table
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | 0.5208 | 0.5517 | 0.4267 | **0.4812** | **0.5569** |
| **Random Forest** | 0.4861 | 0.5143 | 0.2400 | **0.3273** | **0.5281** |
| **Xgboost** | 0.5764 | 0.6944 | 0.3333 | **0.4505** | **0.5934** |

- **Selected Best Model**: `Logistic Regression`
- **Reason for Selection**: Highest F1-score (`0.4812`) and ROC-AUC (`0.5569`) on unseen 2023–2024 seasons.

---

## 2. Task 2: Live Win Probability (Classification)
- **Train Split (2008–2022)**: `108,883` ball states
- **Test Split (2023–2024)**: `16,831` ball states

### Results Comparison Table
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Log Loss | Brier Score |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | 0.7651 | 0.7768 | 0.6806 | 0.7255 | 0.8289 | **0.5764** | **0.1785** |
| **Random Forest** | 0.7863 | 0.7945 | 0.7168 | 0.7536 | 0.8597 | **0.4657** | **0.1513** |
| **Xgboost** | 0.7567 | 0.7509 | 0.6980 | 0.7235 | 0.8354 | **0.5568** | **0.1763** |

- **Selected Best Model**: `Random Forest`
- **Reason for Selection**: Lowest Log Loss (`0.4657`) and Brier Score (`0.1513`), indicating superior probability calibration.

---

## 3. Task 3: Final Score Prediction (Regression)
- **Train Split (2008–2022)**: `116,538` ball states
- **Test Split (2023–2024)**: `18,017` ball states

### Results Comparison Table
| Model | MAE (Runs) | MSE | RMSE (Runs) | R² Score |
|:---|:---:|:---:|:---:|:---:|
| **Linear Regression** | **19.24** | 649.19 | **25.48** | **0.4536** |
| **Random Forest** | **19.85** | 742.00 | **27.24** | **0.3754** |
| **Xgboost** | **20.21** | 736.17 | **27.13** | **0.3803** |

- **Selected Best Model**: `Linear Regression`
- **Reason for Selection**: Lowest RMSE (`25.48` runs) and highest $R^2$ score (`0.4536`).

---

## 4. Task 4: Player of the Match Prediction (Imbalanced Classification)
- **Train Split (2008–2022)**: `20,072` player-match rows
- **Test Split (2023–2024)**: `3,333` player-match rows (Positive ratio: `4.32%`)

### Results Comparison Table
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | 0.6925 | 0.0573 | 0.3958 | 0.1001 | 0.5933 | **0.0645** |
| **Random Forest** | 0.6481 | 0.0599 | 0.4861 | 0.1066 | 0.5913 | **0.0568** |
| **Xgboost** | 0.6127 | 0.0565 | 0.5069 | 0.1016 | 0.5866 | **0.0639** |

- **Selected Best Model**: `Logistic Regression`
- **Reason for Selection**: Highest Precision-Recall AUC (`0.0645`) under class-imbalance weighting.

---

## Summary of Best Selected Models
1. **Match Winner Prediction**: `Logistic Regression`
2. **Live Win Probability**: `Random Forest`
3. **Final Score Prediction**: `Linear Regression`
4. **Player of the Match**: `Logistic Regression`
