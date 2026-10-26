"""
IPLytics - Model Evaluation Module
Phase 4: Evaluation Metrics, Model Comparison, and Visualization

Provides reusable evaluation utilities for classification & regression tasks:
- Confusion matrices, ROC curves, PR curves, Calibration plots, Feature Importance.
- Saves evaluation CSV results & generates reports/MODEL_COMPARISON.md.
"""

import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    log_loss, brier_score_loss, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve, mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.calibration import calibration_curve


def evaluate_classification_models(models_dict, X_test, y_test, is_live_win=False, is_pom=False):
    """Evaluate classification models and return metrics DataFrame."""
    results = []
    
    for name, pipe in models_dict.items():
        y_pred = pipe.predict(X_test)
        y_proba = pipe.predict_proba(X_test)[:, 1] if hasattr(pipe, "predict_proba") else y_pred
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_proba)
        
        res = {
            'model': name,
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'roc_auc': round(roc_auc, 4)
        }
        
        if is_live_win:
            res['log_loss'] = round(log_loss(y_test, y_proba), 4)
            res['brier_score'] = round(brier_score_loss(y_test, y_proba), 4)
            
        if is_pom:
            res['pr_auc'] = round(average_precision_score(y_test, y_proba), 4)
            
        results.append(res)
        
    return pd.DataFrame(results)


def evaluate_regression_models(models_dict, X_test, y_test):
    """Evaluate regression models and return metrics DataFrame."""
    results = []
    
    for name, pipe in models_dict.items():
        y_pred = pipe.predict(X_test)
        
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        
        results.append({
            'model': name,
            'mae': round(mae, 2),
            'mse': round(mse, 2),
            'rmse': round(rmse, 2),
            'r2_score': round(r2, 4)
        })
        
    return pd.DataFrame(results)


def plot_confusion_matrices(models_dict, X_test, y_test, title_prefix, save_path):
    """Plot confusion matrices side by side for comparison."""
    fig, axes = plt.subplots(1, len(models_dict), figsize=(5 * len(models_dict), 4))
    if len(models_dict) == 1:
        axes = [axes]
        
    for ax, (name, pipe) in zip(axes, models_dict.items()):
        y_pred = pipe.predict(X_test)
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax, cbar=False)
        ax.set_title(f"{title_prefix}: {name.replace('_', ' ').title()}")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        
    plt.tight_layout()
    fig.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close(fig)


def plot_roc_curves(models_dict, X_test, y_test, title, save_path):
    """Plot ROC curves for classification models."""
    fig, ax = plt.subplots(figsize=(8, 6))
    
    for name, pipe in models_dict.items():
        y_proba = pipe.predict_proba(X_test)[:, 1]
        fpr, tpr, _ = roc_curve(y_test, y_proba)
        auc = roc_auc_score(y_test, y_proba)
        ax.plot(fpr, tpr, label=f"{name.replace('_', ' ').title()} (AUC = {auc:.3f})", linewidth=2)
        
    ax.plot([0, 1], [0, 1], 'k--', label='Random Chance')
    ax.set_title(title, fontweight='bold')
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.legend(loc='lower right')
    
    plt.tight_layout()
    fig.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close(fig)


def plot_calibration_curves(models_dict, X_test, y_test, title, save_path):
    """Plot probability calibration curves."""
    fig, ax = plt.subplots(figsize=(8, 6))
    
    for name, pipe in models_dict.items():
        y_proba = pipe.predict_proba(X_test)[:, 1]
        prob_true, prob_pred = calibration_curve(y_test, y_proba, n_bins=10)
        ax.plot(prob_pred, prob_true, marker='o', label=name.replace('_', ' ').title(), linewidth=2)
        
    ax.plot([0, 1], [0, 1], 'k--', label='Perfectly Calibrated')
    ax.set_title(title, fontweight='bold')
    ax.set_xlabel("Mean Predicted Probability")
    ax.set_ylabel("Fraction of Positives")
    ax.legend(loc='upper left')
    
    plt.tight_layout()
    fig.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close(fig)


def plot_regression_actual_vs_predicted(models_dict, X_test, y_test, title, save_path):
    """Plot actual vs predicted scatter plots for regression models."""
    fig, axes = plt.subplots(1, len(models_dict), figsize=(5 * len(models_dict), 4))
    if len(models_dict) == 1:
        axes = [axes]
        
    for ax, (name, pipe) in zip(axes, models_dict.items()):
        y_pred = pipe.predict(X_test)
        ax.scatter(y_test, y_pred, alpha=0.3, color='#008080')
        ax.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', label='Perfect Fit')
        ax.set_title(f"{name.replace('_', ' ').title()}")
        ax.set_xlabel("Actual Final Score")
        ax.set_ylabel("Predicted Final Score")
        ax.legend()
        
    plt.tight_layout()
    fig.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close(fig)


def extract_feature_importance(pipe, feature_names):
    """Extract top feature importances or coefficients from a fitted Pipeline."""
    model = pipe.named_steps[pipe.steps[-1][0]]
    preprocessor = pipe.named_steps['preprocessor']
    
    # Get feature names post-one-hot encoding
    try:
        ohe_cols = preprocessor.named_transformers_['cat'].get_feature_names_out()
        num_cols = preprocessor.transformers[1][2]
        all_cols = list(ohe_cols) + list(num_cols)
    except Exception:
        all_cols = feature_names

    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0]) if model.coef_.ndim > 1 else np.abs(model.coef_)
    else:
        return pd.DataFrame()

    df_imp = pd.DataFrame({'feature': all_cols[:len(importances)], 'importance': importances})
    return df_imp.sort_values(by='importance', ascending=False)
