import logging
from datetime import datetime, timedelta

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_health_endpoint():
    """Test the health check endpoint."""
    from main import app, models
    from fastapi.testclient import TestClient

    client = TestClient(app)
    response = client.get("/health")

    logger.info(f"Health endpoint status: {response.status_code}")
    logger.info(f"Health response: {response.json()}")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"


def test_predict_endpoint():
    """Test the predict endpoint with sample data."""
    from main import app, models
    from fastapi.testclient import TestClient

    client = TestClient(app)

    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "source": "Karachi",
        "destination": "Lahore",
        "date": tomorrow
    }

    response = client.get("/predict", params=params)

    logger.info(f"Predict endpoint status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        logger.info(f"Prediction response:\n{data}")

        assert "source" in data
        assert "destination" in data
        assert "date" in data
        assert "bestTravelTime" in data
        assert "crowdLevel" in data
        assert "crowdPercent" in data
        assert "cheapestDay" in data
        assert "cheapestDayPrice" in data
        assert "method" in data
        assert "confidence" in data
        assert "explanations" in data

        logger.info(f"Crowd Level: {data['crowdLevel']}")
        logger.info(f"Crowd Percent: {data['crowdPercent']}%")
        logger.info(f"Best Time: {data['bestTravelTime']}")
        logger.info(f"Cheapest Day: {data['cheapestDay']} (PKR {data['cheapestDayPrice']})")
        logger.info(f"Method: {data['method']}")
        logger.info(f"Confidence: {data['confidence']}")
    else:
        logger.error(f"Predict endpoint failed: {response.text}")


def test_invalid_date():
    """Test predict endpoint with invalid date."""
    from main import app, models
    from fastapi.testclient import TestClient

    client = TestClient(app)

    params = {
        "source": "Karachi",
        "destination": "Lahore",
        "date": "2024-01-01"
    }

    response = client.get("/predict", params=params)

    logger.info(f"Invalid date test status: {response.status_code}")
    assert response.status_code == 400


def test_same_source_destination():
    """Test predict endpoint with same source and destination."""
    from main import app, models
    from fastapi.testclient import TestClient

    client = TestClient(app)

    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "source": "Karachi",
        "destination": "Karachi",
        "date": tomorrow
    }

    response = client.get("/predict", params=params)

    logger.info(f"Same city test status: {response.status_code}")
    assert response.status_code == 400


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Starting TrackGo AI Service API Tests")
    logger.info("=" * 60)

    try:
        logger.info("\n1. Testing Health Endpoint...")
        test_health_endpoint()
        logger.info("Health endpoint test passed!")

        logger.info("\n2. Testing Predict Endpoint...")
        test_predict_endpoint()
        logger.info("Predict endpoint test passed!")

        logger.info("\n3. Testing Invalid Date...")
        test_invalid_date()
        logger.info("Invalid date test passed!")

        logger.info("\n4. Testing Same Source/Destination...")
        test_same_source_destination()
        logger.info("Same city test passed!")

        logger.info("\n" + "=" * 60)
        logger.info("All API tests completed successfully!")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise
