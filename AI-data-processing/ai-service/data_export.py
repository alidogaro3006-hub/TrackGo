import logging
from datetime import datetime
from typing import Optional

import pandas as pd

from preprocessing import TIME_SLOTS

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

_TIME_SLOT_BOUNDS = [(5, 7), (7, 9), (9, 11), (11, 13), (13, 15), (15, 17), (17, 19), (19, 21), (21, 23)]


def bucket_time_slot(departure_time: str) -> str:
    """
    Map an exact 'HH:MM' departure time to the nearest fixed 2-hour time slot
    used by the ML models (e.g. '07:30' -> '07:00-09:00').

    Times outside the modelled 05:00-23:00 window are clamped to the nearest edge slot.
    """
    hour = int(departure_time.split(':')[0])

    for i, (start, end) in enumerate(_TIME_SLOT_BOUNDS):
        if start <= hour < end:
            return TIME_SLOTS[i]

    return TIME_SLOTS[0] if hour < 5 else TIME_SLOTS[-1]


def _configure_dns_fallback():
    """
    Mirror the Go backend's DNS workaround (server.js) so mongodb+srv:// lookups
    don't fail on networks where the system resolver can't reach SRV records.
    Best-effort only: if dnspython's resolver isn't available, real-data export
    is skipped and training falls back to synthetic data.
    """
    try:
        import dns.resolver
        dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
        dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    except Exception as e:
        logger.warning(f"Could not configure DNS fallback resolver: {e}")


def fetch_real_bookings_df(mongo_uri: str, db_name: str) -> pd.DataFrame:
    """
    Pull real Schedule documents (joined with their Route and Vehicle) from MongoDB
    and shape them into the same row format as generate_synthetic_data(), so they
    can be concatenated for training.

    Only schedules whose travel date has already passed are included — a schedule
    still open for booking hasn't reached its final occupancy yet, so including it
    would be a noisy, incomplete signal.
    """
    from pymongo import MongoClient

    _configure_dns_fallback()

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    try:
        db = client[db_name]

        routes = {r['_id']: r for r in db['routes'].find()}
        vehicles = {v['_id']: v for v in db['vehicles'].find()}

        records = []
        for s in db['schedules'].find({'date': {'$lt': datetime.now()}}):
            route = routes.get(s.get('routeId'))
            vehicle = vehicles.get(s.get('vehicleId'))
            if not route or not vehicle:
                continue

            schedule_date = s['date']
            day_of_week = schedule_date.weekday()
            capacity = vehicle['capacity']
            seats_booked = min(len(s.get('bookedSeats', [])), capacity)

            records.append({
                'route_id': f"{route['source'][:3].upper()}-{route['destination'][:3].upper()}",
                'source': route['source'].title(),
                'destination': route['destination'].title(),
                'date': schedule_date,
                'day_of_week': day_of_week,
                'time_slot': bucket_time_slot(s['departureTime']),
                'vehicle_type': vehicle['type'],
                'total_capacity': capacity,
                'seats_booked': seats_booked,
                'price': s['price'],
                'is_weekend': day_of_week >= 5,
                'month': schedule_date.month,
                'week_of_year': schedule_date.isocalendar()[1],
            })

        logger.info(f"Fetched {len(records)} real historical schedule records from MongoDB")
        return pd.DataFrame(records)
    finally:
        client.close()
