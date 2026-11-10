import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock
from preprocessing import generate_synthetic_data, clean_data, engineer_features, get_route_history, prepare_model_features
from rule_engine import predict_crowd_rule, get_best_travel_time, get_cheapest_day, get_selected_day_price, get_rule_recommendation
from explainer import generate_explanations
from httpx import AsyncClient
from main import app


def get_sample_df():
    """Generate a sample dataframe for testing."""
    df = generate_synthetic_data(200)
    df = clean_data(df)
    return engineer_features(df)


def test_generate_data_shape():
    """Test that synthetic data generation creates correct number of records."""
    df = generate_synthetic_data(100)
    assert len(df) == 100
    required_cols = ['source', 'destination', 'day_of_week', 'time_slot', 'vehicle_type', 'seats_booked', 'total_capacity', 'price']
    for col in required_cols:
        assert col in df.columns


def test_clean_data_removes_duplicates():
    """Test that data cleaning removes duplicate records."""
    df = generate_synthetic_data(100)
    df_duped = pd.concat([df, df.head(10)])
    cleaned = clean_data(df_duped)
    assert len(cleaned) <= len(df_duped)


def test_engineer_features_adds_columns():
    """Test that feature engineering adds expected columns."""
    df = generate_synthetic_data(50)
    df = clean_data(df)
    result = engineer_features(df)
    assert 'occupancy_rate' in result.columns
    assert 'crowd_label' in result.columns
    assert result['occupancy_rate'].between(0, 1).all()


def test_get_route_history_returns_empty_not_error():
    """Test that route history returns empty dataframe for non-existent routes."""
    df = get_sample_df()
    result = get_route_history(df, "NonExistent", "City")
    assert isinstance(result, pd.DataFrame)
    assert len(result) == 0


def test_predict_crowd_rule_valid_labels():
    """Test that crowd prediction returns valid labels."""
    df = get_sample_df()
    result = predict_crowd_rule(df, "2025-06-15")
    assert result["crowd_level"] in ["Low", "Medium", "High"]
    assert 0 <= result["crowd_percent"] <= 100


def test_predict_crowd_rule_empty_df():
    """Test that crowd prediction handles empty dataframes gracefully."""
    empty_df = pd.DataFrame(columns=['day_of_week', 'occupancy_rate'])
    result = predict_crowd_rule(empty_df, "2025-06-15")
    assert result["crowd_level"] == "Medium"


def test_get_cheapest_day_returns_valid_day():
    """Test that cheapest day function returns a valid day name."""
    df = get_sample_df()
    result = get_cheapest_day(df)
    valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    assert result["cheapest_day"] in valid_days


def test_get_rule_recommendation_full_output():
    """Test that rule recommendation returns all expected fields."""
    df = get_sample_df()
    result = get_rule_recommendation(df, "2025-06-15")
    for key in ["crowd_level", "crowd_percent", "bestTravelTime", "cheapestDay", "cheapestDayPrice", "selectedDay", "selectedDayPrice"]:
        assert key in result


def test_get_selected_day_price_matches_weekday():
    """Test that the selected day price is the average price for that weekday."""
    df = get_sample_df()
    result = get_selected_day_price(df, "2025-06-15")
    assert result["selected_day"] == "Sunday"
    expected = round(df[df['day_of_week'] == 6]['price'].mean(), 2)
    assert result["avg_price"] == expected


def test_get_selected_day_price_not_below_cheapest():
    """Test that no weekday is cheaper than the reported cheapest day."""
    df = get_sample_df()
    cheapest = get_cheapest_day(df)
    for date in ["2025-06-09", "2025-06-10", "2025-06-11", "2025-06-12", "2025-06-13", "2025-06-14", "2025-06-15"]:
        assert get_selected_day_price(df, date)["avg_price"] >= cheapest["avg_price"]


def test_get_selected_day_price_empty_df():
    """Test that selected day price handles empty dataframes gracefully."""
    empty_df = pd.DataFrame(columns=['day_of_week', 'price'])
    result = get_selected_day_price(empty_df, "2025-06-15")
    assert result["selected_day"] == "Sunday"
    assert result["avg_price"] is None


def test_generate_explanations_all_crowd_levels():
    """Test that explanations are generated for all crowd levels."""
    for level in ["Low", "Medium", "High"]:
        result = generate_explanations(
            "Karachi", "Lahore", "2025-06-15",
            level, 45.0, "07:00-09:00",
            "Tuesday", 750.0, "nn+rule-based"
        )
        assert "crowd" in result
        assert len(result["crowd"]) > 20


@pytest.mark.anyio
async def test_health_endpoint():
    """Test that health endpoint returns OK status."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@pytest.mark.anyio
async def test_predict_invalid_date():
    """Test that predict endpoint rejects past dates."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/predict?source=Karachi&destination=Lahore&date=2020-01-01")
        assert response.status_code == 400


@pytest.mark.anyio
async def test_predict_same_city():
    """Test that predict endpoint rejects same source and destination."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/predict?source=Karachi&destination=Karachi&date=2025-12-01")
        assert response.status_code == 400
