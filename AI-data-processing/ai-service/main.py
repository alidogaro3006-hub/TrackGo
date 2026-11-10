import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from preprocessing import load_blended_data, clean_data, engineer_features, get_route_history
from rule_engine import get_rule_recommendation
from ml_model import load_dt_model, predict_dt
from nn_model import load_nn_model, predict_nn
from explainer import generate_explanations

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models and data at startup, clean up at shutdown."""
    logger.info("TrackGo AI Service starting up...")

    df = load_blended_data()
    df = clean_data(df)
    df = engineer_features(df)
    models["dataframe"] = df
    logger.info(f"Loaded {len(df)} historical records")

    dt_model, dt_encoders = load_dt_model()
    models["dt"] = dt_model
    models["dt_encoders"] = dt_encoders

    nn_model, nn_scaler, nn_encoders = load_nn_model()
    models["nn"] = nn_model
    models["nn_scaler"] = nn_scaler
    models["nn_encoders"] = nn_encoders

    logger.info(f"Startup complete. DT loaded: {dt_model is not None}. NN loaded: {nn_model is not None}")

    yield

    logger.info("Shutting down TrackGo AI Service...")


app = FastAPI(
    title="TrackGo AI Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_ORIGIN", "*")],
    allow_methods=["GET"],
    allow_headers=["*"]
)


@app.get("/health")
def health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "nn_loaded": models.get("nn") is not None,
        "dt_loaded": models.get("dt") is not None
    }


@app.get("/predict")
def predict(
    source: str = Query(..., min_length=2),
    destination: str = Query(..., min_length=2),
    date: str = Query(...)
) -> Dict[str, Any]:
    """
    Get AI-powered travel predictions and recommendations.

    Args:
        source: Source city
        destination: Destination city
        date: Travel date in YYYY-MM-DD format

    Returns:
        Predictions with crowd levels, best travel times, and pricing insights
    """
    logger.info(f"Prediction request: {source} -> {destination} on {date}")

    if source.upper() == destination.upper():
        raise HTTPException(400, "Source and destination cannot be the same")

    try:
        travel_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

    if travel_date < datetime.now().date():
        raise HTTPException(400, "Date cannot be in the past")

    route_df = get_route_history(models["dataframe"], source, destination)
    rule_result = get_rule_recommendation(route_df, date)

    features = {
        "day_of_week": travel_date.weekday(),
        "time_slot": rule_result["bestTravelTime"].replace(" ", ""),
        "vehicle_type": "train",
        "month": travel_date.month,
        "week_of_year": travel_date.isocalendar()[1],
        "is_weekend": travel_date.weekday() >= 5
    }

    final_crowd = rule_result["crowd_level"]
    final_percent = rule_result["crowd_percent"]
    final_confidence = rule_result.get("confidence", 0)
    method = "rule-based"
    dt_feature_importances = None

    if models["nn"] is not None:
        try:
            nn_result = predict_nn(models["nn"], models["nn_scaler"], models["nn_encoders"], features)
            if nn_result["confidence"] >= 0.60:
                final_crowd = nn_result["crowd_level"]
                final_percent = nn_result["crowd_percent"]
                final_confidence = nn_result["confidence"]
                method = "nn+rule-based"
        except Exception as e:
            logger.warning(f"NN prediction failed: {e}. Falling back to rule engine.")

    if method == "rule-based" and models["dt"] is not None:
        try:
            dt_result = predict_dt(models["dt"], models["dt_encoders"], features)
            if dt_result["confidence"] >= 0.55:
                final_crowd = dt_result["crowd_level"]
                final_percent = dt_result["crowd_percent"]
                final_confidence = dt_result["confidence"]
                method = "dt+rule-based"
                dt_feature_importances = list(models["dt"].feature_importances_)
        except Exception as e:
            logger.warning(f"DT prediction failed: {e}")

    explanations = generate_explanations(
        source, destination, date,
        final_crowd, final_percent,
        rule_result["bestTravelTime"],
        rule_result["cheapestDay"],
        rule_result["cheapestDayPrice"],
        method,
        feature_importances=dt_feature_importances
    )

    return {
        "source": source,
        "destination": destination,
        "date": date,
        "bestTravelTime": rule_result["bestTravelTime"],
        "crowdLevel": final_crowd,
        "crowdPercent": final_percent,
        "cheapestDay": rule_result["cheapestDay"],
        "cheapestDayPrice": rule_result["cheapestDayPrice"],
        "selectedDay": rule_result["selectedDay"],
        "selectedDayPrice": rule_result["selectedDayPrice"],
        "method": method,
        "confidence": final_confidence,
        "explanations": explanations
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting TrackGo AI Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
