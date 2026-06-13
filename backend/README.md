Quick start:

1. Install dependencies:

   cd backend
   npm install

2. Copy and edit `.env.example` to `.env` with your Postgres connection string.

3. Start in development:

   npm run dev

API endpoints:
- GET /health  -> { status: 'ok' }
- GET /now     -> returns database NOW() result
