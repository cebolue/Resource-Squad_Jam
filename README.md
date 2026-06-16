# Agile Coordination Tool

This repository contains a React frontend and a Node/Express backend for an Agile coordination dashboard.

## What it includes

- `frontend/`: Vite + React dashboard
- `backend/`: Express API service with PostgreSQL and Azure DevOps integration

## Setup

1. Install frontend dependencies:

   cd frontend
   npm install

2. Install backend dependencies:

   cd ../backend
   npm install

3. Configure the backend `.env` from `.env.example`.

4. Initialize the backend database:

   psql "$DATABASE_URL" -f schema.sql

5. Run the backend:

   npm run dev

6. Run the frontend:

   cd ../frontend
   npm run dev

## Azure DevOps integration

The backend reads `AZURE_DEVOPS_PAT` from the environment and uses the Azure DevOps REST API to fetch work items by team area path and iteration path.
