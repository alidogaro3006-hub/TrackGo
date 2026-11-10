import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

FEATURE_NAMES = ['day_of_week', 'time_slot', 'vehicle_type', 'month', 'week_of_year', 'is_weekend']


def generate_explanations(
    source: str,
    destination: str,
    date_str: str,
    crowd_level: str,
    crowd_percent: float,
    best_time: str,
    cheapest_day: str,
    cheapest_price: float,
    method: str,
    feature_importances: Optional[List[float]] = None
) -> Dict[str, str]:
    """
    Generate human-readable explanations for AI predictions.
    When feature_importances is provided (Decision Tree predictions),
    the top contributing feature is included in the crowd explanation.
    """
    logger.info(f"Generating explanations for {method} predictions: {source} -> {destination} on {date_str}")

    day_name = datetime.strptime(date_str, "%Y-%m-%d").strftime("%A")

    top_feature_text = ""
    if feature_importances is not None and len(feature_importances) == len(FEATURE_NAMES):
        top_idx = int(feature_importances.index(max(feature_importances)))
        top_name = FEATURE_NAMES[top_idx].replace('_', ' ')
        top_pct = round(float(max(feature_importances)) * 100)
        top_feature_text = f" {top_name.capitalize()} was the strongest predictor ({top_pct}% importance)."

    crowd_map = {
        "Low": (
            f"Our model analysed historical bookings for the {source}–{destination} route on {day_name}s. "
            f"Typically only {crowd_percent:.0f}% of seats are filled — great time to travel comfortably."
            f"{top_feature_text}"
        ),
        "Medium": (
            f"On {day_name}s, the {source}–{destination} route runs at about {crowd_percent:.0f}% capacity. "
            f"Expect a moderately busy journey — book early for best seat selection."
            f"{top_feature_text}"
        ),
        "High": (
            f"This is a busy travel day! The {source}–{destination} route typically reaches "
            f"{crowd_percent:.0f}% occupancy on {day_name}s. Book immediately to secure your preferred seats."
            f"{top_feature_text}"
        ),
    }

    best_time_exp = (
        f"The {best_time} time window shows the lowest historical crowding on this route. "
        f"You'll have more seat choices and a more comfortable experience."
    )

    cheapest_exp = (
        f"{cheapest_day}s historically have the lowest average prices (PKR {cheapest_price:,.0f}) "
        f"for the {source}–{destination} route, based on our booking data analysis."
    )

    method_exp = {
        "neural-network": "Neural Network (MLP) prediction",
        "decision-tree": "Decision Tree prediction",
        "nn+rule-based": "Neural Network + Rule Engine hybrid",
        "dt+rule-based": "Decision Tree + Rule Engine hybrid",
        "rule-based": "Statistical rule-based analysis",
        "fallback-cache": "Cached general estimates",
    }.get(method, method)

    return {
        "crowd": crowd_map.get(crowd_level, crowd_map["Medium"]),
        "bestTime": best_time_exp,
        "cheapestDay": cheapest_exp,
        "methodDescription": method_exp,
    }
