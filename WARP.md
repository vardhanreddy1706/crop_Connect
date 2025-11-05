# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install deps
  - Client: `npm install` (run in `client`)
  - Server: `npm install` (run in `server`)
- Run dev
  - Server (Express + Socket.IO on 8000): `npm start` (run in `server`)
  - Client (Vite on 5173/5174): `npm run dev` (run in `client`)
- Build client
  - `npm run build` (run in `client`) → outputs `client/dist`
  - Preview built client: `npm run preview` (run in `client`)
- Lint (client only)
  - `npm run lint` (run in `client`)
- Tests
  - No test runner is configured in either `client` or `server`.

Notes
- The client’s Vite dev server proxies `/api/*` to `http://localhost:8000` (see `client/vite.config.js`).
- CORS on the server allows localhost ports 5173/5174/3000 by default.

## Development workflow

Use two terminals:
1) `server`: `npm start` → Express API at `http://localhost:8000`, Socket.IO on same server.
2) `client`: `npm run dev` → Vite dev server at `http://localhost:5173` (or `5174`).

Environment
- Server expects `.env` with at least: `MONGO_URI`, `PORT` (optional, defaults 8000), `CLIENT_URL` (optional), optional email creds (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`) and `GEMINI_API_KEY` for the chatbot.
- Client may use `.env`/Vite variables; Vite exposes only `VITE_*` variables to the browser.

## Architecture overview

Top-level layout
- `client/` — React app (Vite, React 18, react-router, i18n, Tailwind via `@tailwindcss/vite`).
- `server/` — Node/Express API with MongoDB (Mongoose), Socket.IO, and optional email + Gemini AI integration.

Client (React + Vite)
- Entry: `client/src/main.jsx` mounts `App.jsx`.
- Routing/UI: `src/pages/*`, `src/dashboards/*`, and shared `src/components/*` (e.g., `ChatBot.jsx`, `PaymentModal.jsx`, `NotificationBell.jsx`).
- State/Context: `src/context/*` provides `AuthContext`, `LanguageContext`, and `NotificationContext`.
- Data/i18n: `src/config/api.js` centralizes API base + axios; translations live under `src/locales/` (`en.json`, `hi.json`, `te.json`).
- API access: `src/services/*` wraps REST calls (crops, products, tractors, workers, bookings, notifications, transactions, bids, etc.). Custom hooks in `src/hooks/*` (e.g., `useTransaction.js`).
- Tooling: ESLint configured; Vite plugins: React + Tailwind; dev server proxies `/api` to the backend.

Server (Express + Mongo + Socket.IO)
- Entry: `server/index.js` initializes security middlewares (helmet, compression, rate-limit, CORS), parsers, and attaches `io` + optional `emailTransporter` to `req`.
- DB: `server/config/db.js` connects to Mongo via `MONGO_URI`.
- Routing: `server/routes/*` mounted under `/api/*` (auth, crops, products, tractors, workers, bookings, contact, worker-requirements, tractor-requirements, notifications, transactions, bids, worker-hires, orders, cart).
- Controllers/Models: Domain logic in `server/controllers/*` with Mongoose schemas in `server/models/*` (e.g., `User`, `Crop`, `Product`, `Booking`, `Order`, `Notification`, `Transaction`, `WorkerService`, `TractorService`, etc.).
- Realtime: Socket.IO server (same HTTP server) handling room joins and notifications.
- Email: Optional Nodemailer transport if email creds are present; helpers in `server/utils/*` and `server/services/notificationService.js`.
- AI: `POST /api/crop-connect-chat` uses `@google/generative-ai` with `GEMINI_API_KEY` and model `gemini-2.5-pro`.
- Ops: Health check at `GET /api/health`; graceful shutdown handlers.

Data flow
- Client calls REST endpoints under `/api/*` via service modules; Vite dev proxy forwards to the server on 8000.
- Notifications use Socket.IO channels keyed by user IDs.
