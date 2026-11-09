const { Route, Schedule } = require('../models');

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOTS = [
  [5, 7, '05:00-07:00'],
  [7, 9, '07:00-09:00'],
  [9, 11, '09:00-11:00'],
  [11, 13, '11:00-13:00'],
  [13, 15, '13:00-15:00'],
  [15, 17, '15:00-17:00'],
  [17, 19, '17:00-19:00'],
  [19, 21, '19:00-21:00'],
  [21, 23, '21:00-23:00'],
];

function titleCity(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isoDateUTC(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function pyWeekday(date) {
  return (date.getUTCDay() + 6) % 7;
}

function bucketTime(departureTime) {
  const hour = Number(String(departureTime).split(':')[0]);
  for (const [start, end, label] of TIME_SLOTS) {
    if (hour >= start && hour < end) return label;
  }
  return hour < 5 ? '05:00-07:00' : '21:00-23:00';
}

function crowdFromOccupancy(occupancy) {
  const crowdPercent = Math.round(Math.min(1, Math.max(0, occupancy)) * 1000) / 10;
  const crowdLevel = occupancy < 0.4 ? 'Low' : occupancy <= 0.7 ? 'Medium' : 'High';
  return { crowdLevel, crowdPercent };
}

function occupancyOf(schedule) {
  const capacity = schedule.vehicleId?.capacity || 0;
  if (!capacity) return null;
  return Math.min(1, (schedule.bookedSeats?.length || 0) / capacity);
}

function mean(rows, field) {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + row[field], 0) / rows.length;
}

function buildExplanations({ source, destination, dateStr, crowdLevel, crowdPercent, bestTime, cheapestDay, cheapestPrice, sampleSize, usedLiveDate }) {
  const dayName = new Date(`${dateStr}T12:00:00.000Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
  const basis = usedLiveDate
    ? `live seat occupancy on ${dateStr}`
    : `historical ${dayName} trips on this route`;

  const crowdMap = {
    Low: `Live booking data for ${source}–${destination} shows about ${crowdPercent}% of seats filled (${basis}). This is a comfortable travel day.`,
    Medium: `On this ${source}–${destination} trip, current data shows about ${crowdPercent}% occupancy (${basis}). Book a little earlier for a better seat.`,
    High: `This is a busy ${source}–${destination} travel day. Live data shows about ${crowdPercent}% of seats already taken (${basis}). Book soon.`,
  };

  return {
    crowd: crowdMap[crowdLevel] || crowdMap.Medium,
    bestTime: `${bestTime} is the quietest departure we currently have for ${source}–${destination} on this date, based on actual booked seats.`,
    cheapestDay: `${cheapestDay} currently has the lowest average fare (PKR ${Number(cheapestPrice).toLocaleString('en-PK')}) for ${source}–${destination}, from ${sampleSize} tracked trips.`,
    methodDescription: 'Live occupancy from TrackGo bookings',
  };
}

async function computeLiveRecommendations(source, destination, dateStr) {
  const route = await Route.findOne({
    source: String(source).trim().toUpperCase(),
    destination: String(destination).trim().toUpperCase(),
  });

  if (!route) return null;

  const schedules = await Schedule.find({ routeId: route._id }).populate('vehicleId').lean();
  const rows = [];

  for (const schedule of schedules) {
    const occupancy = occupancyOf(schedule);
    if (occupancy == null) continue;
    const when = new Date(schedule.date);
    rows.push({
      date: isoDateUTC(when),
      weekday: pyWeekday(when),
      departureTime: schedule.departureTime,
      timeSlot: bucketTime(schedule.departureTime),
      occupancy,
      price: schedule.price,
      vehicleType: schedule.vehicleId.type,
      capacity: schedule.vehicleId.capacity,
      booked: schedule.bookedSeats?.length || 0,
    });
  }

  if (rows.length === 0) return null;

  const prettySource = titleCity(source);
  const prettyDestination = titleCity(destination);
  const onDate = rows.filter((row) => row.date === dateStr);
  const weekday = pyWeekday(new Date(`${dateStr}T12:00:00.000Z`));
  const sameWeekday = rows.filter((row) => row.weekday === weekday);
  const crowdRows = onDate.length > 0 ? onDate : sameWeekday.length > 0 ? sameWeekday : rows;
  const { crowdLevel, crowdPercent } = crowdFromOccupancy(mean(crowdRows, 'occupancy'));

  const timeRows = onDate.length > 0 ? onDate : sameWeekday.length > 0 ? sameWeekday : rows;
  const byDeparture = new Map();
  for (const row of timeRows) {
    const key = onDate.length > 0 ? row.departureTime : row.timeSlot;
    if (!byDeparture.has(key)) {
      byDeparture.set(key, { occupancy: 0, n: 0, departureTime: row.departureTime, timeSlot: row.timeSlot });
    }
    const agg = byDeparture.get(key);
    agg.occupancy += row.occupancy;
    agg.n += 1;
  }

  let best = null;
  for (const [key, agg] of byDeparture) {
    const avgOccupancy = agg.occupancy / agg.n;
    if (!best || avgOccupancy < best.avgOccupancy) {
      best = { key, avgOccupancy, departureTime: agg.departureTime, timeSlot: agg.timeSlot };
    }
  }

  const today = isoDateUTC(new Date());
  const upcoming = rows.filter((row) => row.date >= today);
  const priceSource = upcoming.length >= 8 ? upcoming : rows;
  const byDay = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const row of priceSource) {
    byDay[row.weekday].sum += row.price;
    byDay[row.weekday].n += 1;
  }

  const weekdayPrices = DAY_NAMES.map((day, index) => ({
    day,
    avgPrice: byDay[index].n ? Math.round(byDay[index].sum / byDay[index].n) : null,
  }));

  let cheapest = weekdayPrices.find((item) => item.avgPrice != null) || { day: 'Tuesday', avgPrice: 750 };
  for (const item of weekdayPrices) {
    if (item.avgPrice != null && item.avgPrice < cheapest.avgPrice) cheapest = item;
  }

  const liveSchedules = onDate
    .slice()
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
    .map((row) => ({
      departureTime: row.departureTime,
      vehicleType: row.vehicleType,
      occupancyPercent: Math.round(row.occupancy * 100),
      price: row.price,
      booked: row.booked,
      capacity: row.capacity,
    }));

  const bestTravelTime = onDate.length > 0 ? best.departureTime : best.timeSlot;
  const sampleSize = rows.length;
  const confidence = onDate.length > 0
    ? Math.min(0.97, 0.8 + onDate.length * 0.03)
    : Math.min(0.9, 0.55 + Math.min(sampleSize, 80) / 200);

  return {
    source: prettySource,
    destination: prettyDestination,
    date: dateStr,
    bestTravelTime,
    bestTravelSlot: best.timeSlot,
    crowdLevel,
    crowdPercent,
    cheapestDay: cheapest.day,
    cheapestDayPrice: cheapest.avgPrice,
    method: 'live-occupancy',
    confidence: Math.round(confidence * 1000) / 1000,
    sampleSize,
    tripsOnDate: onDate.length,
    weekdayPrices,
    liveSchedules,
    dataSource: onDate.length > 0 ? 'live-schedules' : 'historical-route',
    generatedAt: new Date().toISOString(),
    explanations: buildExplanations({
      source: prettySource,
      destination: prettyDestination,
      dateStr,
      crowdLevel,
      crowdPercent,
      bestTime: bestTravelTime,
      cheapestDay: cheapest.day,
      cheapestPrice: cheapest.avgPrice,
      sampleSize,
      usedLiveDate: onDate.length > 0,
    }),
  };
}

module.exports = {
  computeLiveRecommendations,
};
