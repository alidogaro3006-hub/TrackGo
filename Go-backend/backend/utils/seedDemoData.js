require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User, Route, Vehicle, Schedule, Booking } = require('../models');

const HISTORY_DAYS = 90;
const FUTURE_DAYS = 14;
const DEMO_PASSWORD = 'Demo@1234';

// Python weekday: Monday 0 ... Sunday 6. Tuesday is the cheap day.
const DAY_PRICE = [0.9, 0.72, 0.8, 0.95, 1.08, 1.25, 1.18];

const SLOTS = [
  { dep: '06:00', occ: 0.22, price: 0.85, vehicle: 'bus' },
  { dep: '08:00', occ: 0.62, price: 1.05, vehicle: 'train' },
  { dep: '14:30', occ: 0.4, price: 0.95, vehicle: 'bus' },
  { dep: '18:30', occ: 0.72, price: 1.12, vehicle: 'train' },
];

const CORRIDORS = [
  ['KARACHI', 'LAHORE', 1210],
  ['LAHORE', 'ISLAMABAD', 375],
  ['KARACHI', 'ISLAMABAD', 1410],
  ['ISLAMABAD', 'PESHAWAR', 180],
  ['KARACHI', 'HYDERABAD', 165],
  ['LAHORE', 'FAISALABAD', 180],
  ['LAHORE', 'MULTAN', 340],
  ['LAHORE', 'SIALKOT', 130],
  ['KARACHI', 'QUETTA', 690],
  ['LAHORE', 'GUJRANWALA', 80],
  ['RAWALPINDI', 'LAHORE', 360],
  ['MULTAN', 'KARACHI', 880],
  ['FAISALABAD', 'ISLAMABAD', 320],
  ['SUKKUR', 'KARACHI', 470],
  ['BAHAWALPUR', 'LAHORE', 420],
  ['SARGODHA', 'LAHORE', 190],
  ['LARKANA', 'KARACHI', 450],
  ['PESHAWAR', 'LAHORE', 520],
];

const FIRST_NAMES = ['Ali', 'Hassan', 'Usman', 'Bilal', 'Hamza', 'Sara', 'Ayesha', 'Fatima', 'Zainab', 'Omar', 'Hina', 'Imran', 'Nadia', 'Sana', 'Kamran', 'Maryam', 'Rabia', 'Danish', 'Zara', 'Farhan', 'Hira', 'Saad', 'Maha', 'Waleed'];
const LAST_NAMES = ['Khan', 'Malik', 'Sheikh', 'Qureshi', 'Raza', 'Iqbal', 'Farooq', 'Siddiqui', 'Butt', 'Chaudhry'];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function atNoonUtc(dayOffset) {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

function pyWeekday(date) {
  return (date.getUTCDay() + 6) % 7;
}

function addMinutes(dep, minutes) {
  const [hour, minute] = dep.split(':').map(Number);
  const total = hour * 60 + minute + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(wrapped / 60)).padStart(2, '0');
  const mm = String(wrapped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function seatList(count) {
  const seats = new Array(count);
  for (let i = 0; i < count; i += 1) seats[i] = i + 1;
  return seats;
}

function buildSchedule(routeId, vehicle, km, dayOffset, slot, rand) {
  const date = atNoonUtc(dayOffset);
  const weekday = pyWeekday(date);
  const isFuture = dayOffset >= 0;

  let occ = slot.occ;
  if (weekday === 4) occ += 0.1;
  if (weekday >= 5) occ += 0.5;
  occ += (rand() - 0.5) * 0.05;
  occ = Math.min(0.96, Math.max(0.08, occ));

  const seatsToLeaveFree = isFuture ? Math.max(8, Math.round(vehicle.capacity * 0.35)) : 0;
  const bookedCount = Math.max(
    isFuture ? 2 : 1,
    Math.min(Math.round(vehicle.capacity * occ), vehicle.capacity - seatsToLeaveFree)
  );

  const perKm = vehicle.type === 'train' ? 2.2 : 3;
  let price = km * perKm * DAY_PRICE[weekday] * slot.price;
  price *= 0.97 + rand() * 0.06;
  price = Math.max(150, Math.round(price / 10) * 10);

  const speed = vehicle.type === 'train' ? 80 : 55;
  const travelMinutes = Math.max(90, Math.round((km / speed) * 60));

  return {
    routeId,
    vehicleId: vehicle._id,
    date,
    departureTime: slot.dep,
    arrivalTime: addMinutes(slot.dep, travelMinutes),
    price,
    bookedSeats: seatList(bookedCount),
    showcase: isFuture && dayOffset <= 7 && slot.dep === '08:00',
  };
}

async function ensureRoutes() {
  const routes = [];
  for (const [source, destination, km] of CORRIDORS) {
    for (const [from, to] of [[source, destination], [destination, source]]) {
      let route = await Route.findOne({ source: from, destination: to });
      if (!route) route = await Route.create({ source: from, destination: to });
      routes.push({ route, km });
    }
  }
  return routes;
}

async function ensureVehicles() {
  const specs = [];
  for (let i = 1; i <= 8; i += 1) {
    specs.push({ type: 'bus', capacity: 45, registrationNumber: `TG-BUS-${String(i).padStart(2, '0')}` });
  }
  for (let i = 1; i <= 6; i += 1) {
    specs.push({ type: 'train', capacity: 200, registrationNumber: `TG-TRN-${String(i).padStart(2, '0')}` });
  }

  const vehicles = [];
  for (const spec of specs) {
    let vehicle = await Vehicle.findOne({ registrationNumber: spec.registrationNumber });
    if (!vehicle) vehicle = await Vehicle.create(spec);
    vehicles.push(vehicle);
  }
  return vehicles;
}

async function clearPreviousDemo(vehicles) {
  const vehicleIds = vehicles.map((vehicle) => vehicle._id);
  const scheduleIds = await Schedule.find({ vehicleId: { $in: vehicleIds } }).distinct('_id');
  if (scheduleIds.length > 0) {
    await Booking.deleteMany({ scheduleId: { $in: scheduleIds } });
    await Schedule.deleteMany({ _id: { $in: scheduleIds } });
  }

  const demoUsers = await User.find({ email: /@trackgo\.test$/ }).select('_id');
  if (demoUsers.length > 0) {
    await Booking.deleteMany({ userId: { $in: demoUsers.map((user) => user._id) } });
    await User.deleteMany({ _id: { $in: demoUsers.map((user) => user._id) } });
  }
  return scheduleIds.length;
}

async function createPassengers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const docs = FIRST_NAMES.map((first, index) => ({
    name: `${first} ${LAST_NAMES[index % LAST_NAMES.length]}`,
    email: `passenger${String(index + 1).padStart(2, '0')}@trackgo.test`,
    passwordHash,
    phone: `0300${String(1000000 + index).slice(-7)}`,
    role: 'user',
  }));
  return User.insertMany(docs);
}

async function seedDemoData() {
  const rand = mulberry32(20261108);
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('Connected');

  const vehicles = await ensureVehicles();
  const removed = await clearPreviousDemo(vehicles);
  console.log(`Cleared ${removed} previous demo schedules`);

  const routes = await ensureRoutes();
  const buses = vehicles.filter((vehicle) => vehicle.type === 'bus');
  const trains = vehicles.filter((vehicle) => vehicle.type === 'train');
  console.log(`Routes ready: ${routes.length}. Writing schedules...`);

  let historical = 0;
  let upcoming = 0;
  const showcase = [];

  for (let r = 0; r < routes.length; r += 1) {
    const { route, km } = routes[r];
    const docs = [];
    for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset += 1) {
      for (const slot of SLOTS) {
        const pool = slot.vehicle === 'bus' ? buses : trains;
        const vehicle = pool[r % pool.length];
        docs.push(buildSchedule(route._id, vehicle, km, offset, slot, rand));
      }
    }

    const created = await Schedule.insertMany(docs);
    for (let i = 0; i < created.length; i += 1) {
      if (docs[i].date < atNoonUtc(0)) historical += 1;
      else upcoming += 1;
      if (docs[i].showcase) showcase.push(created[i]);
    }
    console.log(`  ${r + 1}/${routes.length} ${route.source} -> ${route.destination} (${created.length})`);
  }

  const passengers = await createPassengers();
  const ahmed = await User.findOne({ email: 'ahmed@test.com' });
  const bookingDocs = [];

  showcase.forEach((schedule, index) => {
    const user = index < 8 && ahmed ? ahmed : passengers[index % passengers.length];
    const seats = schedule.bookedSeats.slice(0, index % 3 === 0 ? 2 : 1);
    const status = index % 11 === 0 ? 'pending' : index % 9 === 0 ? 'cancelled' : 'confirmed';
    bookingDocs.push({
      userId: user._id,
      scheduleId: schedule._id,
      seats: status === 'cancelled' ? seats : seats,
      totalPrice: seats.length * schedule.price,
      status,
      bookingDate: new Date(Date.now() - (index % 20) * 24 * 60 * 60 * 1000),
    });
  });

  if (bookingDocs.length > 0) await Booking.insertMany(bookingDocs);

  console.log('Demo seed complete');
  console.log(`Historical schedules: ${historical}`);
  console.log(`Upcoming schedules: ${upcoming}`);
  console.log(`Passenger accounts: ${passengers.length} (${DEMO_PASSWORD})`);
  console.log(`Bookings created: ${bookingDocs.length}`);
  console.log('Viva routes: Karachi -> Lahore, Lahore -> Islamabad, Islamabad -> Peshawar');

  await mongoose.disconnect();
}

seedDemoData().catch((error) => {
  console.error('Demo seed failed:', error.message);
  process.exit(1);
});
