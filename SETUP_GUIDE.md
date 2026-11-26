# SmartPill setup

SmartPill uses PostgreSQL. Configure the API before starting the application:

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a reachable PostgreSQL database and `JWT_SECRET` to a strong random value.
3. Install dependencies with `npm install`.
4. Create or update the database tables with `npm run migrate --prefix api`.
5. Start the app with `npm run dev`.

For Vercel, configure `DATABASE_URL` and `JWT_SECRET` in the project environment variables. The root build command builds the frontend from `src/`; the API is served through `api/index.js`.
