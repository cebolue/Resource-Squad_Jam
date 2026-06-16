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

Proxy
-----
The frontend is configured to proxy requests starting with `/api` to `http://localhost:4000`.
Example: a request to `/api/teams` is proxied to `http://localhost:4000/api/teams`.

Build
-----
```powershell
npm run build
npm run preview
```
