Frontend (React + Vite)
=======================

Quick start (development):

1. Install dependencies:

```powershell
cd C:\Agile_cordination_tool\frontend
npm install
```

2. Start dev server (Vite):

```powershell
npm run dev
```

The dev server is available at: http://localhost:5173/

When started from the repository root with `npm run dev:frontend` or `npm run dev`, the frontend is pinned to `http://localhost:5175/` so the VS Code launch profile can open a predictable URL.

Proxy
-----
The frontend uses relative `/api` requests by default and proxies them to `http://localhost:4000` in development.
Example: a request to `/api/teams` is proxied to `http://localhost:4000/api/teams`.

If you need the frontend to call a different backend host directly, set `VITE_API_BASE` in your frontend environment.

Build
-----
```powershell
npm run build
npm run preview
```
