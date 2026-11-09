from __future__ import annotations

import logging
import os
import numpy as np
import pandas as pd
import joblib
from typing import Optional, Dict, Any, Tuple

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logging.warning("TensorFlow not available. Neural Network model will not work.")

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def build_nn(input_dim: int, num_classes: int = 3) -> tf.keras.Model:
    """
    Build a Multi-Layer Perceptron (MLP) neural network for crowd prediction.

    Args:
        input_dim: Number of input features
        num_classes: Number of output classes (default: 3 for Low/Medium/High)

    Returns:
        Compiled Keras model
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required for neural network model")

    logger.info(f"Building MLP with input_dim={input_dim}, num_classes={num_classes}")

    model = keras.Sequential([
        layers.Dense(128, activation='relu', input_dim=input_dim),
        layers.BatchNormalization(),
        layers.Dropout(0.3),

        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),

        layers.Dense(32, activation='relu'),
        layers.Dropout(0.1),

        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    logger.info("Neural Network architecture built successfully")
    return model


def train_nn_model(X: pd.DataFrame, y: pd.Series, label_encoders: Dict) -> Tuple:
    """
    Train a Neural Network model for crowd prediction.

    Args:
        X: Feature matrix
        y: Target labels (crowd_label: 0=Low, 1=Medium, 2=High)
        label_encoders: Dictionary containing label encoders

    Returns:
        Tuple of (model, scaler, accuracy, history)
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required for neural network training")

    logger.info("Training Neural Network model...")

    X_arr = X.values.astype(np.float32)
    y_arr = y.values.astype(np.int32)

    X_train, X_test, y_train, y_test = train_test_split(
        X_arr, y_arr, test_size=0.2, random_state=42, stratify=y_arr
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = build_nn(X_train_scaled.shape[1])

    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            'models/nn_best.keras',
            save_best_only=True,
            monitor='val_accuracy',
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-5,
            verbose=1
        )
    ]

    logger.info("Starting training with early stopping and learning rate reduction...")

    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_test_scaled, y_test),
        epochs=100,
        batch_size=64,
        callbacks=callbacks,
        verbose=1
    )

    y_pred = np.argmax(model.predict(X_test_scaled, verbose=0), axis=1)
    acc = accuracy_score(y_test, y_pred)

    logger.info(f"Neural Network accuracy: {acc:.3f}")
    logger.info("\n" + classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

    return model, scaler, acc, history


def save_nn_model(
    model: tf.keras.Model,
    scaler: StandardScaler,
    label_encoders: Dict,
    acc: float,
    model_path: str = "models/nn_model.keras",
    meta_path: str = "models/nn_meta.pkl"
) -> None:
    """
    Save the trained Neural Network model and metadata.

    Args:
        model: Trained Keras model
        scaler: Fitted StandardScaler
        label_encoders: Dictionary with label encoders
        acc: Model accuracy
        model_path: Path to save the Keras model
        meta_path: Path to save metadata (scaler, encoders, accuracy)
    """
    os.makedirs("models", exist_ok=True)

    model.save(model_path)

    metadata = {
        "scaler": scaler,
        "label_encoders": label_encoders,
        "accuracy": acc
    }
    joblib.dump(metadata, meta_path)

    logger.info(f"NN model saved to {model_path}. Accuracy: {acc:.3f}")


def load_nn_model(
    model_path: str = "models/nn_model.keras",
    meta_path: str = "models/nn_meta.pkl"
) -> Tuple[Optional[tf.keras.Model], Optional[StandardScaler], Optional[Dict]]:
    """
    Load a trained Neural Network model from disk.

    Args:
        model_path: Path to the saved Keras model
        meta_path: Path to the saved metadata

    Returns:
        Tuple of (model, scaler, label_encoders) or (None, None, None) if not found
    """
    if not TF_AVAILABLE:
        logger.warning("TensorFlow not available")
        return None, None, None

    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        logger.warning("NN model files not found")
        return None, None, None

    try:
        model = keras.models.load_model(model_path)
        meta = joblib.load(meta_path)

        scaler = meta["scaler"]
        label_encoders = meta["label_encoders"]
        accuracy = meta.get("accuracy", 0.0)

        logger.info(f"NN model loaded from {model_path} with accuracy {accuracy:.3f}")
        return model, scaler, label_encoders
    except Exception as e:
        logger.error(f"Error loading NN model: {e}")
        return None, None, None


def predict_nn(
    model: tf.keras.Model,
    scaler: StandardScaler,
    label_encoders: Dict,
    features: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Make a prediction using the trained Neural Network model.

    Args:
        model: Trained Keras model
        scaler: Fitted StandardScaler
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
        ]], dtype=np.float32)

        scaled = scaler.transform(feature_array)
        probas = model.predict(scaled, verbose=0)[0]
        pred_idx = int(np.argmax(probas))

        labels = ["Low", "Medium", "High"]
        crowd_level = labels[pred_idx]

        crowd_percent = round(float(np.dot(probas, [20.0, 55.0, 85.0])), 1)
        confidence = round(float(probas[pred_idx]), 3)

        logger.info(f"NN prediction: {crowd_level} ({crowd_percent}%) with confidence {confidence}")

        return {
            "crowd_level": crowd_level,
            "crowd_percent": crowd_percent,
            "confidence": confidence,
            "method": "neural-network"
        }
    except Exception as e:
        logger.error(f"Error in NN prediction: {e}")
        return {
            "crowd_level": "Medium",
            "crowd_percent": 50.0,
            "confidence": 0.0,
            "method": "neural-network",
            "error": str(e)
        }


def run_nn_training_pipeline() -> float:
    """
    Run the complete Neural Network training pipeline.

    Returns:
        Final model accuracy
    """
    if not TF_AVAILABLE:
        logger.error("TensorFlow not available. Cannot run NN training pipeline.")
        return 0.0

    from preprocessing import load_blended_data, clean_data, engineer_features, prepare_model_features

    logger.info("Starting NN training pipeline...")

    df = load_blended_data()
    logger.info(f"Loaded {len(df)} records")

    df = clean_data(df)
    logger.info(f"Cleaned data: {len(df)} records")

    df = engineer_features(df)
    logger.info("Features engineered")

    X, y, label_encoders = prepare_model_features(df)
    logger.info(f"Prepared features: X shape = {X.shape}, y shape = {y.shape}")

    model, scaler, acc, history = train_nn_model(X, y, label_encoders)

    save_nn_model(model, scaler, label_encoders, acc)

    logger.info(f"NN pipeline complete. Final accuracy: {acc:.3f}")
    return acc


if __name__ == "__main__":
    run_nn_training_pipeline()
