# TrackGo AI Service

AI-powered travel recommendations service for TrackGo. Provides crowd predictions, best travel times, and pricing insights using hybrid machine learning models.

## Overview

The TrackGo AI Service combines multiple AI approaches to deliver accurate travel predictions:

- **Neural Network (MLP)**: Deep learning model for pattern recognition
- **Decision Tree**: Explainable ML model for classification
- **Rule-Based Engine**: Statistical analysis of historical data
- **Hybrid Intelligence**: Combines all approaches with confidence-based fallbacks

## Features

- Real-time crowd level predictions (Low/Medium/High)
- Best travel time recommendations
- Cheapest day identification with pricing
- Human-readable explanations for all predictions
- Multiple prediction methods with confidence scoring
- RESTful API with FastAPI

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

## Installation

1. Navigate to the ai-service directory:
```bash
cd ai-service
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env to customize settings
```

Default configuration:
- `PORT=8000` - API server port
- `BACKEND_ORIGIN=*` - CORS allowed origins
- `MODEL_PATH=models/` - Model storage directory
- `MONGO_URI` (optional) - Same MongoDB the Go backend uses. When set, training
  blends in real historical bookings alongside synthetic data instead of using
  synthetic data only. See "Real-data blending" below.
- `MONGO_DB_NAME=test` (optional) - Database name to read from when `MONGO_URI` is set.

## Training

Before running the service, train the AI models:

```bash
python train.py
```

This will:
1. Load 2000 synthetic historical records, blended with real bookings if `MONGO_URI` is set
2. Engineer features for ML models
3. Train Decision Tree classifier
4. Train Neural Network (MLP)
5. Save models to `models/` directory

Training takes approximately 2-3 minutes and outputs:
- `models/dt_model.pkl` - Decision Tree model, encoders, and accuracy (bundled together)
- `models/nn_model.keras` - Neural Network model
- `models/nn_meta.pkl` - Feature scaler, encoders, and accuracy for the NN (bundled together)

### Real-data blending

By default (no `MONGO_URI`), training runs entirely on synthetic data — useful for
a fresh install with no bookings yet. Set `MONGO_URI` (and optionally `MONGO_DB_NAME`,
default `test`) to the same MongoDB the Go backend uses, and `preprocessing.load_blended_data()`
will additionally pull real `schedules` (joined with their `routes`/`vehicles`) whose
travel date has already passed, and blend them in:

- No real records yet → synthetic data only.
- Fewer than 50 real records → synthetic + all real records combined.
- 50+ real records → real data as the primary signal, topped up with a small
  synthetic sample so the model still generalizes to routes without history yet.

If MongoDB is unreachable or misconfigured, training logs a warning and falls back
to synthetic data only rather than failing. Re-run `python train.py` whenever you
want the models refreshed with the latest real bookings.

## Running

Start the API server:

```bash
python run.py
```

The server will:
1. Check for trained models
2. Run training automatically if models are missing
3. Start on port 8000 (or PORT env variable)

Alternatively, run directly with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "nn_loaded": true,
  "dt_loaded": true
}
```

### GET /predict

Get AI-powered travel predictions.

**Query Parameters:**
- `source` (required): Source city name (min 2 characters)
- `destination` (required): Destination city name (min 2 characters)
- `date` (required): Travel date in YYYY-MM-DD format

**Example Request:**
```bash
curl "http://localhost:8000/predict?source=Karachi&destination=Lahore&date=2025-12-01"
```

**Example Response:**
```json
{
  "source": "Karachi",
  "destination": "Lahore",
  "date": "2025-12-01",
  "bestTravelTime": "07:00-09:00",
  "crowdLevel": "Low",
  "crowdPercent": 35.5,
  "cheapestDay": "Tuesday",
  "cheapestDayPrice": 850,
  "method": "nn+rule-based",
  "confidence": 0.85,
  "explanations": {
    "crowd": "Our AI analyzed historical bookings for the Karachi–Lahore route on Tuesdays. Typically only 36% of seats are filled — great time to travel comfortably.",
    "bestTime": "The 07:00-09:00 time window shows the lowest historical crowding on this route. You'll have more seat choices and a more comfortable experience.",
    "cheapestDay": "Tuesdays historically have the lowest average prices (PKR 850) for the Karachi–Lahore route, based on our booking data analysis.",
    "methodDescription": "Neural Network + Rule Engine hybrid"
  }
}
```

**Error Responses:**

400 Bad Request - Invalid parameters:
```json
{
  "detail": "Source and destination cannot be the same"
}
```

```json
{
  "detail": "Invalid date format. Use YYYY-MM-DD"
}
```

```json
{
  "detail": "Date cannot be in the past"
}
```

## Prediction Methods

The service uses an intelligent fallback chain:

1. **Neural Network (confidence ≥ 60%)**: Primary prediction method
2. **Decision Tree (confidence ≥ 55%)**: Fallback if NN unavailable or low confidence
3. **Rule-Based Engine**: Final fallback using statistical analysis

Response includes the `method` field indicating which approach was used:
- `nn+rule-based`: Neural Network with rule engine insights
- `dt+rule-based`: Decision Tree with rule engine insights
- `rule-based`: Pure statistical analysis

## Testing

Run the complete test suite:

```bash
pytest tests/
```

Run with coverage:

```bash
pytest tests/ --cov=. --cov-report=html
```

Run specific test file:

```bash
pytest tests/test_ai.py -v
```

Test the API manually:

```bash
# Health check
curl http://localhost:8000/health

# Get prediction
curl "http://localhost:8000/predict?source=Karachi&destination=Lahore&date=2025-12-01"
```

## Project Structure

```
ai-service/
├── main.py                 # FastAPI application with lifespan management
├── preprocessing.py        # Data generation & feature engineering
├── rule_engine.py         # Statistical analysis & rule-based predictions
├── ml_model.py           # Decision Tree classifier
├── nn_model.py           # Neural Network MLP
├── explainer.py          # Human-readable explanation generator
├── train.py              # Full training pipeline
├── run.py                # Server startup script
├── test_modules.py       # Module unit tests
├── test_api.py          # API integration tests
├── requirements.txt      # Python dependencies
├── .env                 # Environment configuration
├── tests/
│   ├── __init__.py
│   └── test_ai.py       # Pytest test suite
├── models/              # Trained models (created during training)
│   ├── dt_model.pkl
│   ├── dt_encoders.pkl
│   ├── nn_model.keras
│   ├── nn_scaler.pkl
│   └── nn_encoders.pkl
└── README.md
```

## Development

### Adding New Routes

To add new city routes, update the `ROUTES` constant in `preprocessing.py`:

```python
ROUTES = [
    ("Karachi", "Lahore"),
    ("Karachi", "Islamabad"),
    # Add new routes here
]
```

### Improving Model Accuracy

1. Increase synthetic data volume in `preprocessing.py`
2. Adjust model hyperparameters in `ml_model.py` and `nn_model.py`
3. Add more features in `engineer_features()` function
4. Retrain models: `python train.py`

### Adjusting Confidence Thresholds

Edit confidence thresholds in `main.py`:

```python
if nn_result["confidence"] >= 0.60:  # Adjust NN threshold
    # Use Neural Network prediction

if dt_result["confidence"] >= 0.55:  # Adjust DT threshold
    # Use Decision Tree prediction
```

## Performance

- API response time: ~50-100ms (with models loaded)
- Model loading time: ~2-3 seconds at startup
- Training time: ~2-3 minutes for full pipeline
- Memory usage: ~200-300MB with all models loaded

## Troubleshooting

**Issue: Models not found error**
```bash
# Solution: Run training first
python train.py
```

**Issue: Import errors**
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Issue: Port already in use**
```bash
# Solution: Change port in .env or use environment variable
PORT=8001 python run.py
```

**Issue: TensorFlow warnings**
```bash
# Solution: These are informational and can be ignored
# To suppress: export TF_CPP_MIN_LOG_LEVEL=2
```

## Integration with TrackGo Backend

The AI service is designed to be called by the TrackGo Node.js backend:

```javascript
const response = await fetch(
  `http://localhost:8000/predict?source=Karachi&destination=Lahore&date=2025-12-01`
);
const predictions = await response.json();
```

Configure the backend origin in `.env`:
```
BACKEND_ORIGIN=http://localhost:5000
```

## License

Part of the TrackGo project.

## Support

For issues or questions, please refer to the main TrackGo project documentation.
