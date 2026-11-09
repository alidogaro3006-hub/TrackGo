require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const { User, Route, Vehicle, Schedule, Booking } = require('../models');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing existing data...');
    await Booking.deleteMany({});
    await Schedule.deleteMany({});
    await Vehicle.deleteMany({});
    await Route.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Existing data cleared\n');

    console.log('👥 Seeding users...');
    const admin = await User.create({
      name: 'TrackGo Admin',
      email: 'admin@trackgo.com',
      passwordHash: 'Admin@123',
      phone: '03001234567',
      role: 'admin'
    });

    const testUser = await User.create({
      name: 'Ahmed Khan',
      email: 'ahmed@test.com',
      passwordHash: 'Test@1234',
      phone: '03009876543',
      role: 'user'
    });
    console.log('✅ Users created\n');

    console.log('🛤️  Seeding routes...');
    const routes = await Route.insertMany([
      { source: 'KARACHI', destination: 'LAHORE' },
      { source: 'LAHORE', destination: 'ISLAMABAD' },
      { source: 'ISLAMABAD', destination: 'PESHAWAR' },
      { source: 'KARACHI', destination: 'HYDERABAD' },
      { source: 'LAHORE', destination: 'FAISALABAD' }
    ]);
    console.log('✅ Routes created\n');

    console.log('🚌 Seeding vehicles...');
    const vehicles = await Vehicle.insertMany([
      { type: 'train', capacity: 200, registrationNumber: 'TRN-001' },
      { type: 'bus', capacity: 45, registrationNumber: 'BUS-001' },
      { type: 'bus', capacity: 45, registrationNumber: 'BUS-002' }
    ]);
    console.log('✅ Vehicles created\n');

    console.log('📅 Seeding schedules...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = [];

    schedules.push({
      routeId: routes[0]._id,
      vehicleId: vehicles[0]._id,
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      departureTime: '08:00',
      arrivalTime: '20:00',
      price: 1500
    });

    schedules.push({
      routeId: routes[0]._id,
      vehicleId: vehicles[1]._id,
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      departureTime: '09:30',
      arrivalTime: '22:00',
      price: 1200
    });

    schedules.push({
      routeId: routes[1]._id,
      vehicleId: vehicles[2]._id,
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      departureTime: '07:00',
      arrivalTime: '11:30',
      price: 800
    });

    schedules.push({
      routeId: routes[1]._id,
      vehicleId: vehicles[0]._id,
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      departureTime: '14:00',
      arrivalTime: '18:00',
      price: 950
    });

    schedules.push({
      routeId: routes[2]._id,
      vehicleId: vehicles[1]._id,
      date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      departureTime: '06:00',
      arrivalTime: '09:30',
      price: 600
    });

    schedules.push({
      routeId: routes[3]._id,
      vehicleId: vehicles[2]._id,
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      departureTime: '10:00',
      arrivalTime: '12:30',
      price: 450
    });

    schedules.push({
      routeId: routes[4]._id,
      vehicleId: vehicles[1]._id,
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      departureTime: '15:00',
      arrivalTime: '18:00',
      price: 700
    });

    schedules.push({
      routeId: routes[0]._id,
      vehicleId: vehicles[0]._id,
      date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      departureTime: '11:00',
      arrivalTime: '23:00',
      price: 1400
    });

    const createdSchedules = await Schedule.insertMany(schedules);
    console.log('✅ Schedules created\n');

    console.log('🎫 Seeding bookings...');
    await Booking.insertMany([
      {
        userId: testUser._id,
        scheduleId: createdSchedules[0]._id,
        seats: [1, 2],
        totalPrice: 3000,
        status: 'confirmed'
      },
      {
        userId: testUser._id,
        scheduleId: createdSchedules[1]._id,
        seats: [5],
        totalPrice: 1200,
        status: 'confirmed'
      },
      {
        userId: testUser._id,
        scheduleId: createdSchedules[2]._id,
        seats: [10, 11],
        totalPrice: 1600,
        status: 'cancelled'
      }
    ]);

    await Schedule.findByIdAndUpdate(createdSchedules[0]._id, {
      $push: { bookedSeats: { $each: [1, 2] } }
    });

    await Schedule.findByIdAndUpdate(createdSchedules[1]._id, {
      $push: { bookedSeats: { $each: [5] } }
    });

    console.log('✅ Bookings created\n');

    console.log('🎉 Seed complete!\n');
    console.log('📧 Admin: admin@trackgo.com / Admin@123');
    console.log('📧 User: ahmed@test.com / Test@1234\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
