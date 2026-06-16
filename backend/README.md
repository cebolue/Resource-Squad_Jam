Quick start:

1. Install dependencies:

   cd backend
   npm install

2. Copy `.env.example` to `.env` and set the following variables:

   DATABASE_URL=postgres://user:password@localhost:5432/dbname
   AZURE_DEVOPS_PAT=your_personal_access_token_here
   PORT=4000

3. Initialize the database schema:

Option A - using `psql`:

   psql "$DATABASE_URL" -f schema.sql

Option B - using the included Node helper (no `psql` required):

   # ensure DATABASE_URL is set in your .env or environment
   node init_db.js

4. Start the backend in development:

   npm run dev

API endpoints:
- GET /health
- GET /api/teams
- GET /api/teams/:id/dashboard

The dashboard route fetches Azure DevOps work items for each team configuration and returns metrics including:
- originalEstimate
- completedWork
- bugsAndRequirementsCompleted
- sprintVelocity
- averageCompletedHours
- workItems

Use the `teams` table in `schema.sql` to manage each team’s Azure DevOps organization, project, area path, and iteration path.
