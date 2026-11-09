import logging
import joblib
import os
import numpy as np
from typing import Optional, Dict, Any, Tuple
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_dt_model(X: pd.DataFrame, y: pd.Series, label_encoders: Dict) -> Tuple[DecisionTreeClassifier, float]:
    """
    Train a Decision Tree classifier for crowd prediction.

    Args:
        X: Feature matrix with encoded features
        y: Target labels (crowd_label: 0=Low, 1=Medium, 2=High)
        label_encoders: Dictionary containing label encoders for time_slot and vehicle_type

    Returns:
        Tuple of (trained_model, accuracy)
    """
    logger.info("Training Decision Tree model...")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = DecisionTreeClassifier(
        max_depth=10,
        min_samples_split=20,
        min_samples_leaf=10,
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    logger.info(f"Decision Tree accuracy: {acc:.3f}")
    logger.info("\n" + classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

    return model, acc


def save_dt_model(
    model: DecisionTreeClassifier,
    label_encoders: Dict,
    acc: float,
    path: str = "models/dt_model.pkl"
) -> None:
    """
    Save the trained Decision Tree model with metadata.

    Args:
        model: Trained DecisionTreeClassifier
        label_encoders: Dictionary with 'time_slot' and 'vehicle_type' LabelEncoders
        acc: Model accuracy
        path: Path to save the model
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)

    bundle = {
        "model": model,
        "label_encoders": label_encoders,
        "accuracy": acc
    }

    joblib.dump(bundle, path)
    logger.info(f"DT model saved to {path} with accuracy {acc:.3f}")


def load_dt_model(path: str = "models/dt_model.pkl") -> Tuple[Optional[DecisionTreeClassifier], Optional[Dict]]:
    """
    Load a trained Decision Tree model from disk.

    Args:
        path: Path to the saved model file

    Returns:
        Tuple of (model, label_encoders) or (None, None) if not found
    """
    if not os.path.exists(path):
        logger.warning(f"DT model not found at {path}")
        return None, None

    try:
        bundle = joblib.load(path)
        model = bundle["model"]
        label_encoders = bundle["label_encoders"]
        accuracy = bundle.get("accuracy", 0.0)

        logger.info(f"DT model loaded from {path} with accuracy {accuracy:.3f}")
        return model, label_encoders
    except Exception as e:
        logger.error(f"Error loading DT model: {e}")
        return None, None


def predict_dt(model: DecisionTreeClassifier, label_encoders: Dict, features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make a prediction using the trained Decision Tree model.

    Args:
        model: Trained DecisionTreeClassifier
        label_encoders: Dictionary with 'time_slot' and 'vehicle_type' LabelEncoders
        features: Dictionary with keys: day_of_week, time_slot, vehicle_type, month, week_of_year, is_weekend

    Returns:
        Dictionary with crowd_level, crowd_percent, confidence, method
    """
    try:
        time_slot_encoder = label_encoders.get('time_slot')
        vehicle_type_encoder = label_encoders.get('vehicle_type')

        try:
            encoded_time_slot = time_slot_encoder.transform([features['time_slot']])[0]
        except (ValueError, KeyError):
            logger.warning(f"Unseen time_slot: {features.get('time_slot')}, using 0")
            encoded_time_slot = 0

        try:
            encoded_vehicle_type = vehicle_type_encoder.transform([features['vehicle_type']])[0]
        except (ValueError, KeyError):
            logger.warning(f"Unseen vehicle_type: {features.get('vehicle_type')}, using 0")
            encoded_vehicle_type = 0

        feature_array = np.array([[
            features['day_of_week'],
            encoded_time_slot,
            encoded_vehicle_type,
            features['month'],
            features['week_of_year'],
            int(features['is_weekend'])
        ]])

        probas = model.predict_proba(feature_array)[0]
        pred_idx = np.argmax(probas)

        labels = ["Low", "Medium", "High"]
        crowd_level = labels[pred_idx]

        crowd_percent = round(float(np.dot(probas, [20, 55, 85])), 1)
        confidence = round(float(probas[pred_idx]), 3)

        logger.info(f"DT prediction: {crowd_level} ({crowd_percent}%) with confidence {confidence}")

        return {
            "crowd_level": crowd_level,
            "crowd_percent": crowd_percent,
            "confidence": confidence,
            "method": "decision-tree"
        }
    except Exception as e:
        logger.error(f"Error in DT prediction: {e}")
        return {
            "crowd_level": "Medium",
            "crowd_percent": 50.0,
            "confidence": 0.0,
            "method": "decision-tree",
            "error": str(e)
        }
