from dotenv import load_dotenv
from preprocessing import load_blended_data, clean_data, engineer_features, prepare_model_features
from ml_model import train_dt_model, save_dt_model
from nn_model import run_nn_training_pipeline
import logging
import os

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def run_full_training():
    """Run the complete training pipeline for all models."""
    logging.info("=" * 50)
    logging.info("TrackGo AI — Full Training Pipeline")
    logging.info("=" * 50)

    logging.info("Step 1/4: Loading and preprocessing data...")
    df = load_blended_data()
    df = clean_data(df)
    df = engineer_features(df)
    logging.info(f"Dataset ready: {len(df)} records, {df['route_id'].nunique()} routes")

    logging.info("Step 2/4: Preparing features...")
    X, y, label_encoders = prepare_model_features(df)
    logging.info(f"Feature matrix: {X.shape}. Class distribution: {y.value_counts().to_dict()}")

    logging.info("Step 3/4: Training Decision Tree...")
    dt_model, dt_acc = train_dt_model(X, y, label_encoders)
    save_dt_model(dt_model, label_encoders, dt_acc)

    logging.info("Step 4/4: Training Neural Network...")
    nn_acc = run_nn_training_pipeline()

    logging.info("=" * 50)
    logging.info(f"Training complete!")
    logging.info(f"  Decision Tree accuracy: {dt_acc:.1%}")
    logging.info(f"  Neural Network accuracy: {nn_acc:.1%}")
    logging.info("Models saved to models/ folder.")
    logging.info("You can now start the API server with: python run.py")
    logging.info("=" * 50)


if __name__ == "__main__":
    run_full_training()
