import os
import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO)

if not os.path.exists("models/nn_model.keras") or not os.path.exists("models/dt_model.pkl"):
    logging.info("Model files not found. Running training pipeline first...")
    result = subprocess.run([sys.executable, "train.py"], check=True)
    logging.info("Training complete. Starting API server...")

import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=False)
