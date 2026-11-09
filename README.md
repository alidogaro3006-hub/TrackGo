# TrackGo

Final-year project: an AI-assisted bus and train booking app for Pakistan.

## Parts

- `Go-frontend` — React website
- `Go-backend/backend` — Node.js API and MongoDB
- `AI-data-processing/ai-service` — recommendation service
- `TrackGo_FYP_Report_Final.docx` — project report

## Run it on your Mac

1. Copy each `.env.example` to `.env` and fill in the database address. Do not commit `.env`.
2. In `Go-backend/backend`: `npm install`, then `npm run dev`.
3. In `Go-frontend`: `npm install`, then `npm run dev`.
4. Open http://localhost:5173

Demo sign-in after seeding: `ahmed@test.com` / `Test@1234` and `admin@trackgo.com` / `Admin@123`.

Load the viva dataset with `npm run seed:demo` inside `Go-backend/backend`.
