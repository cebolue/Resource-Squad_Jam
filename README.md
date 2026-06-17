# Agile Coordination Tool

This repository contains a React frontend and a Node/Express backend for an Agile coordination dashboard.

## What it includes

- `frontend/`: Vite + React dashboard
- `backend/`: Express API service with PostgreSQL and Azure DevOps integration

## Setup

1. Install root, frontend, and backend dependencies:

   cd C:\Agile_cordination_tool
   npm install

   cd frontend
   npm install

2. Install backend dependencies:

   cd ../backend
   npm install

3. Configure the backend `.env` from `.env.example`.

   copy .env.example .env

4. Initialize the backend database:

   psql "$DATABASE_URL" -f schema.sql

5. Run the backend:

   npm run dev

6. Run the frontend:

   cd ../frontend
   npm run dev

7. Optional: run both services from the repo root with one command:

   npm run dev

8. Optional: run individual services from the repo root using helper scripts:

   npm run dev:backend
   npm run dev:frontend

The frontend now defaults to relative `/api` requests in development, so Vite proxies API calls to the backend on port `4000`. If you need to bypass the proxy in another environment, set `VITE_API_BASE` explicitly.

## VS Code local development

This workspace includes VS Code tasks and launch settings for one-click development:

- Task: `Start full stack dev`
- Launch profile: `Launch Full Stack App`

The launch profile starts backend and frontend dev servers, then opens the React app at `http://localhost:5175` in a browser debugger.

## Azure DevOps integration

The backend reads `AZURE_DEVOPS_PAT` from the environment and uses the Azure DevOps REST API to fetch work items by team area path and iteration path.
