import logging
import pandas as pd
from datetime import datetime, timedelta
from preprocessing import (
    generate_synthetic_data,
    load_data,
    clean_data,
    engineer_features,
    get_route_history,
    prepare_model_features
)
from rule_engine import (
    predict_crowd_rule,
    get_best_travel_time,
    get_cheapest_day,
    get_rule_recommendation
)
from ml_model import (
    train_dt_model,
    save_dt_model,
    load_dt_model,
    predict_dt
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_preprocessing():
    """Test the preprocessing module."""
    logger.info("=" * 60)
    logger.info("Testing Preprocessing Module")
    logger.info("=" * 60)

    df = generate_synthetic_data(n_records=2000)
    logger.info(f"Generated {len(df)} records")
    logger.info(f"Columns: {df.columns.tolist()}")
    logger.info(f"\nFirst few rows:\n{df.head()}")

    df_clean = clean_data(df)
    logger.info(f"\nCleaned data: {len(df_clean)} records")

    df_features = engineer_features(df_clean)
    logger.info(f"\nEngineered features added")
    logger.info(f"New columns: occupancy_rate, crowd_label, price_normalized")
    logger.info(f"Crowd label distribution:\n{df_features['crowd_label'].value_counts()}")

    return df_features


def test_rule_engine(df: pd.DataFrame):
    """Test the rule engine module."""
    logger.info("\n" + "=" * 60)
    logger.info("Testing Rule Engine Module")
    logger.info("=" * 60)

    route_df = get_route_history(df, "Karachi", "Lahore")
    logger.info(f"\nRoute data (Karachi -> Lahore): {len(route_df)} records")

    test_date = datetime.now().strftime("%Y-%m-%d")
    logger.info(f"\nTesting for date: {test_date}")

    crowd = predict_crowd_rule(route_df, test_date)
    logger.info(f"\nCrowd prediction: {crowd}")

    best_time = get_best_travel_time(route_df, test_date)
    logger.info(f"\nBest travel time: {best_time}")

    cheapest = get_cheapest_day(route_df)
    logger.info(f"\nCheapest day: {cheapest}")

    recommendation = get_rule_recommendation(route_df, test_date)
    logger.info(f"\nFull recommendation: {recommendation}")


def test_ml_model(df: pd.DataFrame):
    """Test the ML model training and prediction."""
    logger.info("\n" + "=" * 60)
    logger.info("Testing ML Model Module")
    logger.info("=" * 60)

    X, y, label_encoders = prepare_model_features(df)
    logger.info(f"\nPrepared features: X shape = {X.shape}, y shape = {y.shape}")
    logger.info(f"Label encoders: {list(label_encoders.keys())}")

    model, accuracy = train_dt_model(X, y, label_encoders)
    logger.info(f"\nModel trained with accuracy: {accuracy:.3f}")

    save_dt_model(model, label_encoders, accuracy)
    logger.info("Model saved successfully")

    loaded_model, loaded_encoders = load_dt_model()
    if loaded_model is not None:
        logger.info("Model loaded successfully")

        test_features = {
            'day_of_week': 1,
            'time_slot': '07:00-09:00',
            'vehicle_type': 'train',
            'month': 4,
            'week_of_year': 14,
            'is_weekend': False
        }

        prediction = predict_dt(loaded_model, loaded_encoders, test_features)
        logger.info(f"\nTest prediction for {test_features}:")
        logger.info(f"Result: {prediction}")
    else:
        logger.error("Failed to load model")


if __name__ == "__main__":
    logger.info("Starting TrackGo AI Module Tests")
    logger.info("=" * 60)

    df = test_preprocessing()

    test_rule_engine(df)

    test_ml_model(df)

    logger.info("\n" + "=" * 60)
    logger.info("All tests completed successfully!")
    logger.info("=" * 60)
