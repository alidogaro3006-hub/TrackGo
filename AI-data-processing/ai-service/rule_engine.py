import logging
import pandas as pd
from datetime import datetime
from typing import Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

TIME_SLOTS = [
    "05:00-07:00", "07:00-09:00", "09:00-11:00", "11:00-13:00",
    "13:00-15:00", "15:00-17:00", "17:00-19:00", "19:00-21:00", "21:00-23:00"
]

CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar",
    "Quetta", "Multan", "Faisalabad", "Hyderabad", "Sialkot",
    "Gujranwala", "Bahawalpur", "Sargodha", "Sukkur", "Larkana"
]

DAY_NAMES = {
    0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday",
    4: "Friday", 5: "Saturday", 6: "Sunday"
}


def _ensure_occupancy(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or 'occupancy_rate' in df.columns:
        return df
    out = df.copy()
    capacity = out['total_capacity'].replace(0, pd.NA)
    out['occupancy_rate'] = (out['seats_booked'] / capacity).clip(0, 1).fillna(0)
    return out


def _row_dates(df: pd.DataFrame) -> pd.Series:
    return pd.to_datetime(df['date'], utc=True, errors='coerce').dt.date


def _rows_on_date(route_df: pd.DataFrame, date_str: str) -> pd.DataFrame:
    if route_df.empty or 'date' not in route_df.columns:
        return route_df.iloc[0:0]
    try:
        target = datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return route_df.iloc[0:0]
    return route_df[_row_dates(route_df) == target]


def predict_crowd_rule(route_df: pd.DataFrame, date_str: str) -> Dict[str, Any]:
    """
    Predict crowd level using rule-based approach based on historical occupancy.

    Args:
        route_df: Historical data for the specific route
        date_str: Target date in YYYY-MM-DD format

    Returns:
        Dictionary with crowd_level, crowd_percent, confidence, method
    """
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = target_date.weekday()
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid date format: {date_str}, error: {e}")
        return {
            "crowd_level": "Medium",
            "crowd_percent": 50.0,
            "confidence": 0.0,
            "note": "Invalid date format"
        }

    route_df = _ensure_occupancy(route_df)
    on_date = _rows_on_date(route_df, date_str)
    filtered = on_date.copy() if len(on_date) > 0 else route_df[route_df['day_of_week'] == day_of_week].copy()

    if filtered.empty:
        logger.warning(f"No historical data for day {day_of_week}")
        return {
            "crowd_level": "Medium",
            "crowd_percent": 50.0,
            "confidence": 0.0,
            "note": "Insufficient data"
        }

    avg_occupancy = filtered['occupancy_rate'].mean()
    crowd_percent = round(avg_occupancy * 100, 1)

    if avg_occupancy < 0.4:
        crowd_level = "Low"
    elif avg_occupancy <= 0.7:
        crowd_level = "Medium"
    else:
        crowd_level = "High"

    confidence = round(min(len(filtered) / 50, 1.0), 2)

    logger.info(f"Rule-based crowd prediction: {crowd_level} ({crowd_percent}%) with confidence {confidence}")

    return {
        "crowd_level": crowd_level,
        "crowd_percent": crowd_percent,
        "confidence": confidence,
        "method": "rule-based"
    }


def get_best_travel_time(route_df: pd.DataFrame, date_str: str) -> Dict[str, Any]:
    """
    Find the best travel time (least crowded time slot) for a given date.

    Args:
        route_df: Historical data for the specific route
        date_str: Target date in YYYY-MM-DD format

    Returns:
        Dictionary with best_time, avg_occupancy, reason
    """
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = target_date.weekday()
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid date format: {date_str}, error: {e}")
        return {
            "best_time": "07:00-09:00",
            "avg_occupancy": 0.45,
            "reason": "General estimate - invalid date format"
        }

    route_df = _ensure_occupancy(route_df)
    on_date = _rows_on_date(route_df, date_str)
    if len(on_date) > 0:
        filtered = on_date.copy()
        min_count = 1
        time_key = 'departure_time' if 'departure_time' in filtered.columns and filtered['departure_time'].notna().any() else 'time_slot'
    else:
        filtered = route_df[route_df['day_of_week'] == day_of_week].copy()
        min_count = 3
        time_key = 'time_slot'

    if filtered.empty:
        logger.warning(f"No historical data for day {day_of_week}")
        return {
            "best_time": "07:00-09:00",
            "avg_occupancy": 0.45,
            "reason": "General estimate - insufficient route data"
        }

    grouped = filtered.groupby(time_key)['occupancy_rate'].agg(['mean', 'count'])
    # Ignore a time slot that only appears once or twice unless we are using
    # live trips on the requested date.
    reliable = grouped[grouped['count'] >= min_count]
    if not reliable.empty:
        grouped = reliable

    if grouped.empty:
        return {
            "best_time": "07:00-09:00",
            "avg_occupancy": 0.45,
            "reason": "General estimate - no time slot data"
        }

    best_slot = grouped['mean'].idxmin()
    min_occ = grouped['mean'].min()

    availability_percent = round((1 - min_occ) * 100)
    reason = f"Historically {availability_percent}% seats available in this window"

    logger.info(f"Best travel time: {best_slot} with {min_occ:.3f} occupancy")

    return {
        "best_time": best_slot,
        "avg_occupancy": round(min_occ, 3),
        "reason": reason
    }


def get_cheapest_day(route_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Find the cheapest day of the week to travel on this route.

    Args:
        route_df: Historical data for the specific route

    Returns:
        Dictionary with cheapest_day, avg_price, currency
    """
    if route_df.empty:
        logger.warning("No data available for cheapest day calculation")
        return {
            "cheapest_day": "Tuesday",
            "avg_price": 750.0,
            "currency": "PKR"
        }

    price_df = route_df
    if 'date' in route_df.columns:
        today = datetime.utcnow().date()
        upcoming = route_df[_row_dates(route_df) >= today]
        if len(upcoming) >= 8:
            price_df = upcoming

    day_price = price_df.groupby('day_of_week')['price'].mean()

    if day_price.empty:
        return {
            "cheapest_day": "Tuesday",
            "avg_price": 750.0,
            "currency": "PKR"
        }

    cheapest_day_num = day_price.idxmin()
    min_price = day_price.min()

    cheapest_day_name = DAY_NAMES.get(cheapest_day_num, "Tuesday")

    logger.info(f"Cheapest day: {cheapest_day_name} at PKR {min_price:.2f}")

    return {
        "cheapest_day": cheapest_day_name,
        "avg_price": round(min_price, 2),
        "currency": "PKR"
    }


def get_rule_recommendation(route_df: pd.DataFrame, date_str: str) -> Dict[str, Any]:
    """
    Combine all rule-based predictions into a single recommendation.

    Args:
        route_df: Historical data for the specific route
        date_str: Target date in YYYY-MM-DD format

    Returns:
        Dictionary with all predictions combined
    """
    logger.info(f"Generating rule-based recommendation for date: {date_str}")

    crowd = predict_crowd_rule(route_df, date_str)
    best_time = get_best_travel_time(route_df, date_str)
    cheapest = get_cheapest_day(route_df)

    recommendation = {
        **crowd,
        "bestTravelTime": best_time["best_time"],
        "cheapestDay": cheapest["cheapest_day"],
        "cheapestDayPrice": cheapest["avg_price"],
        "bestTimeReason": best_time["reason"]
    }

    return recommendation
