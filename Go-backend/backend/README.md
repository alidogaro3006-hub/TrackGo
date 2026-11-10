# TrackGo Backend API

TrackGo is a comprehensive Railway and Bus Ticket Reservation System backend built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization with JWT
- Admin panel for managing routes, vehicles, and schedules
- Real-time seat booking with conflict prevention
- AI-powered travel recommendations
- Comprehensive error handling and validation
- RESTful API design

## Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/trackgo
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Default Credentials

After running the seed script, use these credentials to test:

**Admin Account:**
- Email: `admin@trackgo.com`
- Password: `Admin@123`

**Test User Account:**
- Email: `ahmed@test.com`
- Password: `Test@1234`

## API Endpoints

### Authentication & Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | None | Register a new user |
| POST | `/api/users/login` | None | Login and get JWT token |
| GET | `/api/users/profile` | User | Get current user profile |
| PUT | `/api/users/profile` | User | Update user profile |

### Bookings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookings/search` | None | Search available schedules |
| GET | `/api/bookings/schedule/:id` | User | Get a schedule with available seats |
| POST | `/api/bookings` | User | Create a new booking |
| GET | `/api/bookings/my` | User | Get user's bookings |
| PUT | `/api/bookings/:id/cancel` | User | Cancel a booking |

### Admin - Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/routes` | Admin | Create a new route |
| GET | `/api/admin/routes` | Admin | Get all routes |
| PUT | `/api/admin/routes/:id` | Admin | Update a route |

### Admin - Vehicles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/vehicles` | Admin | Create a new vehicle |
| GET | `/api/admin/vehicles` | Admin | Get all vehicles |
| PUT | `/api/admin/vehicles/:id` | Admin | Update a vehicle |

### Admin - Schedules

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/schedules` | Admin | Create a new schedule |
| GET | `/api/admin/schedules` | Admin | Get all schedules |
| PUT | `/api/admin/schedules/:id` | Admin | Update a schedule |
| DELETE | `/api/admin/schedules/:id` | Admin | Delete a schedule |

### AI Recommendations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/recommendations` | User | Get AI travel recommendations |

**Query Parameters:**
- `source` (required): Departure city
- `destination` (required): Arrival city
- `date` (required): Travel date (YYYY-MM-DD)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get the token by logging in through `/api/users/login`.

## Frontend Integration

Set the `FRONTEND_URL` environment variable to your frontend application URL to enable CORS. The backend will accept requests from this origin.

Example:
```env
FRONTEND_URL=http://localhost:3000
```

## AI Service Integration

The recommendations endpoint proxies requests to an external AI service. Configure the AI service URL:

```env
AI_SERVICE_URL=http://localhost:8000
```

The backend handles:
- Connection timeouts (10s)
- Service unavailability with fallback responses
- Automatic error recovery

## Database Models

### User
- name, email, password (hashed), phone, role (user/admin)

### Route
- source, destination (uppercase)

### Vehicle
- type (train/bus), capacity, registrationNumber

### Schedule
- routeId, vehicleId, date, departureTime, arrivalTime, price, bookedSeats

### Booking
- userId, scheduleId, seats, totalPrice, status (confirmed/cancelled)

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
- 502: Bad Gateway (AI service error)
- 503: Service Unavailable (AI service timeout)

## Development

The project uses:
- Express.js for routing
- Mongoose for MongoDB ODM
- bcryptjs for password hashing
- jsonwebtoken for authentication
- express-validator for input validation
- axios for HTTP requests to AI service
- helmet for security headers
- morgan for logging

## License

MIT
