import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import LabelEncoder
from typing import Optional, Tuple, Dict
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar",
    "Quetta", "Multan", "Faisalabad", "Hyderabad", "Sialkot",
    "Gujranwala", "Bahawalpur", "Sargodha", "Sukkur", "Larkana"
]

TIME_SLOTS = [
    "05:00-07:00", "07:00-09:00", "09:00-11:00", "11:00-13:00",
    "13:00-15:00", "15:00-17:00", "17:00-19:00", "19:00-21:00",
    "21:00-23:00"
]

VEHICLE_TYPES = ["bus", "train"]

ROUTE_DISTANCES = {
    ("Karachi", "Lahore"): 1200,
    ("Karachi", "Islamabad"): 1400,
    ("Lahore", "Islamabad"): 375,
    ("Lahore", "Rawalpindi"): 350,
    ("Karachi", "Hyderabad"): 165,
    ("Lahore", "Faisalabad"): 130,
    ("Islamabad", "Peshawar"): 170,
    ("Lahore", "Multan"): 340,
    ("Karachi", "Quetta"): 680,
    ("Lahore", "Sialkot"): 125,
}


def generate_synthetic_data(n_records: int = 2000) -> pd.DataFrame:
    """
    Generate synthetic booking data for TrackGo with realistic patterns.

    Creates data with higher bookings on weekends, morning/evening peak times,
    and varying demand by route. Uses seed=42 for reproducibility.

    Args:
        n_records: Number of records to generate (default: 2000)

    Returns:
        DataFrame with columns: route_id, source, destination, date, day_of_week,
        time_slot, vehicle_type, total_capacity, seats_booked, price, is_weekend,
        month, week_of_year
    """
    logger.info(f"Generating {n_records} synthetic records...")
    np.random.seed(42)

    records = []
    base_date = datetime.now() - timedelta(days=365)

    for _ in range(n_records):
        days_offset = np.random.randint(0, 365)
        record_date = base_date + timedelta(days=days_offset)
        day_of_week = record_date.weekday()
        is_weekend = day_of_week >= 5

        source = np.random.choice(CITIES)
        destination = np.random.choice([c for c in CITIES if c != source])
        route_id = f"{source[:3].upper()}-{destination[:3].upper()}"

        time_slot = np.random.choice(TIME_SLOTS)
        vehicle_type = np.random.choice(VEHICLE_TYPES)

        total_capacity = 45 if vehicle_type == "bus" else 200

        is_peak_time = time_slot in ["07:00-09:00", "17:00-19:00", "19:00-21:00"]
        base_occupancy = 0.3

        if is_weekend:
            base_occupancy += 0.2
        if is_peak_time:
            base_occupancy += 0.25

        popular_routes = [("Karachi", "Lahore"), ("Lahore", "Islamabad"),
                         ("Karachi", "Islamabad")]
        if (source, destination) in popular_routes or (destination, source) in popular_routes:
            base_occupancy += 0.15

        occupancy = np.clip(base_occupancy + np.random.normal(0, 0.15), 0, 1)
        seats_booked = int(occupancy * total_capacity)

        route_key = (source, destination)
        reverse_route_key = (destination, source)
        base_distance = ROUTE_DISTANCES.get(route_key) or ROUTE_DISTANCES.get(reverse_route_key, 500)

        base_price = base_distance * 0.8 if vehicle_type == "bus" else base_distance * 1.2
        price = base_price * (1 + np.random.uniform(-0.2, 0.2))

        records.append({
            'route_id': route_id,
            'source': source,
            'destination': destination,
            'date': record_date,
            'day_of_week': day_of_week,
            'time_slot': time_slot,
            'vehicle_type': vehicle_type,
            'total_capacity': total_capacity,
            'seats_booked': seats_booked,
            'price': round(price, 2),
            'is_weekend': is_weekend,
            'month': record_date.month,
            'week_of_year': record_date.isocalendar()[1]
        })

    df = pd.DataFrame(records)
    logger.info(f"Generated {len(df)} records with {df['route_id'].nunique()} unique routes")
    return df


def load_data(filepath: Optional[str] = None) -> pd.DataFrame:
    """
    Load booking data from CSV file or generate synthetic data.

    Args:
        filepath: Path to CSV file (optional). If None or file doesn't exist,
                 generates synthetic data instead.

    Returns:
        DataFrame with booking data
    """
    if filepath and os.path.exists(filepath):
        logger.info(f"Loading data from {filepath}")
        df = pd.read_csv(filepath, parse_dates=['date'])
        logger.info(f"Loaded {len(df)} records from file")
        return df
    else:
        if filepath:
            logger.warning(f"File {filepath} not found, generating synthetic data instead")
        else:
            logger.info("No filepath provided, generating synthetic data")
        return generate_synthetic_data(2000)


def load_blended_data(min_real_rows: int = 50) -> pd.DataFrame:
    """
    Build the training dataset by blending real historical bookings (from MongoDB)
    with synthetic data, so the models bootstrap on synthetic patterns when the app
    is new and progressively shift toward real usage as bookings accumulate.

    Behavior (controlled by MONGO_URI / MONGO_DB_NAME env vars):
      - MONGO_URI not set, or the DB is unreachable: synthetic data only (cold start).
      - Some real records exist but fewer than min_real_rows: synthetic + all real
        records combined, so real signal nudges the model without dominating it.
      - At least min_real_rows real records exist: real data is treated as the
        primary signal, topped up with a small synthetic sample so the model still
        generalizes to routes without real history yet.
    """
    synthetic_df = generate_synthetic_data(2000)

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        logger.info("MONGO_URI not set - training on synthetic data only")
        return synthetic_df

    try:
        from data_export import fetch_real_bookings_df
        db_name = os.getenv("MONGO_DB_NAME", "test")
        real_df = fetch_real_bookings_df(mongo_uri, db_name)
    except Exception as e:
        logger.warning(f"Could not fetch real booking data ({e}); falling back to synthetic data only")
        return synthetic_df

    if len(real_df) == 0:
        logger.info("No real schedule history yet - training on synthetic data only")
        return synthetic_df

    if len(real_df) < min_real_rows:
        logger.info(f"Only {len(real_df)} real records found - blending with synthetic data")
        return pd.concat([synthetic_df, real_df], ignore_index=True)

    logger.info(f"{len(real_df)} real records found - using real data as primary signal")
    # only top up routes that have no real history, so route averages reflect real prices
    real_routes = set(zip(real_df['source'].str.lower(), real_df['destination'].str.lower()))
    synthetic_routes = list(zip(synthetic_df['source'].str.lower(), synthetic_df['destination'].str.lower()))
    unseen = synthetic_df[[r not in real_routes for r in synthetic_routes]]
    supplement = unseen.sample(n=min(300, len(unseen)), random_state=42)
    return pd.concat([supplement, real_df], ignore_index=True)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and validate booking data.

    Removes duplicates, handles missing values, and validates data integrity.

    Args:
        df: Raw booking DataFrame

    Returns:
        Cleaned DataFrame
    """
    logger.info(f"Cleaning data, initial records: {len(df)}")
    initial_count = len(df)

    df = df.drop_duplicates().copy()
    duplicates_removed = initial_count - len(df)
    if duplicates_removed > 0:
        logger.info(f"Removed {duplicates_removed} duplicate records")

    numeric_columns = ['seats_booked', 'price', 'total_capacity', 'day_of_week',
                      'month', 'week_of_year']
    for col in numeric_columns:
        if col in df.columns and df[col].isnull().any():
            median_val = df[col].median()
            null_count = df[col].isnull().sum()
            df[col] = df[col].fillna(median_val)
            logger.info(f"Filled {null_count} missing values in {col} with median {median_val}")

    required_columns = ['source', 'destination', 'date']
    missing_mask = df[required_columns].isnull().any(axis=1)
    missing_count = missing_mask.sum()
    if missing_count > 0:
        df = df[~missing_mask].copy()
        logger.info(f"Removed {missing_count} records with missing required fields")

    invalid_seats = df['seats_booked'] > df['total_capacity']
    if invalid_seats.any():
        invalid_count = invalid_seats.sum()
        df.loc[invalid_seats, 'seats_booked'] = df.loc[invalid_seats, 'total_capacity']
        logger.warning(f"Clipped {invalid_count} records where seats_booked exceeded capacity")

    df['seats_booked'] = df['seats_booked'].clip(lower=0)

    logger.info(f"Cleaning complete, final records: {len(df)}")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add derived features for ML model training.

    Creates occupancy rate, crowd labels, and normalized prices.

    Args:
        df: Cleaned booking DataFrame

    Returns:
        DataFrame with additional engineered features
    """
    logger.info("Engineering features...")

    df['occupancy_rate'] = (df['seats_booked'] / df['total_capacity']).clip(0, 1)

    def get_crowd_label(occupancy: float) -> int:
        if occupancy < 0.4:
            return 0
        elif occupancy <= 0.7:
            return 1
        else:
            return 2

    df['crowd_label'] = df['occupancy_rate'].apply(get_crowd_label)

    crowd_distribution = df['crowd_label'].value_counts().sort_index()
    logger.info(f"Crowd label distribution - Low (0): {crowd_distribution.get(0, 0)}, "
               f"Medium (1): {crowd_distribution.get(1, 0)}, High (2): {crowd_distribution.get(2, 0)}")

    if 'route_id' in df.columns:
        df['price_normalized'] = df.groupby('route_id')['price'].transform(
            lambda x: (x - x.min()) / (x.max() - x.min()) if x.max() > x.min() else 0
        )
    else:
        df['price_normalized'] = (df['price'] - df['price'].min()) / (df['price'].max() - df['price'].min())

    logger.info(f"Feature engineering complete. Added: occupancy_rate, crowd_label, price_normalized")
    return df


def get_route_history(df: pd.DataFrame, source: str, destination: str) -> pd.DataFrame:
    """
    Filter booking data for a specific route.

    Args:
        df: Booking DataFrame
        source: Source city name (case-insensitive)
        destination: Destination city name (case-insensitive)

    Returns:
        Filtered DataFrame for the specified route (empty if no matches)
    """
    source_lower = source.lower()
    destination_lower = destination.lower()

    filtered = df[
        (df['source'].str.lower() == source_lower) &
        (df['destination'].str.lower() == destination_lower)
    ]

    logger.info(f"Route history for {source} -> {destination}: {len(filtered)} records found")
    return filtered


def prepare_model_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, Dict[str, LabelEncoder]]:
    """
    Prepare features and target for ML model training.

    Encodes categorical variables and extracts feature matrix X and target y.

    Args:
        df: DataFrame with engineered features

    Returns:
        Tuple of (X: feature DataFrame, y: target Series, encoders: dict of LabelEncoders)
    """
    logger.info("Preparing model features...")

    time_slot_encoder = LabelEncoder()
    time_slot_encoder.fit(TIME_SLOTS)
    df['time_slot_encoded'] = time_slot_encoder.transform(df['time_slot'])

    vehicle_encoder = LabelEncoder()
    vehicle_encoder.fit(VEHICLE_TYPES)
    df['vehicle_type_encoded'] = vehicle_encoder.transform(df['vehicle_type'])

    df['is_weekend_int'] = df['is_weekend'].astype(int)

    feature_columns = [
        'day_of_week',
        'time_slot_encoded',
        'vehicle_type_encoded',
        'month',
        'week_of_year',
        'is_weekend_int'
    ]

    X = df[feature_columns].copy()
    y = df['crowd_label'].copy()

    label_encoders = {
        'time_slot': time_slot_encoder,
        'vehicle_type': vehicle_encoder
    }

    logger.info(f"Prepared features: {X.shape[0]} samples, {X.shape[1]} features")
    logger.info(f"Feature columns: {feature_columns}")
    logger.info(f"Target distribution: {y.value_counts().sort_index().to_dict()}")

    return X, y, label_encoders
