# CSR Portal — Next.js 14 + Prisma (SQL Server) + Socket.IO

Production-ready, role-based CSR Portal with Admin + Agent roles, real-time order grids, audit trail, and a premium modern UI scaffold.

## Tech Stack
- Next.js 14 (App Router), React 18
- Tailwind CSS + shadcn/ui + Lucide icons
- Framer Motion + Lenis for smoothness
- AG Grid / TanStack Table (scaffold ready for either)
- Socket.IO (server + client)
- Prisma ORM with Microsoft SQL Server (provider="sqlserver")
- NextAuth.js (Credentials Provider) with Prisma Adapter
- React Query + Zustand

## Quick Start (Local Dev)

1) Clone and install
```bash
git clone <your-repo-url>
cd darjaah-csr-portal
npm install
```

2) Configure environment variables
- Copy `env.sample` to `.env` and update values as needed.
- Example SQL Server connection string (for local dev):
```
DATABASE_URL="sqlserver://sa:INse14ron.@DESKTOP-4A1H4P7:1433;database=darjaah_csr;trustServerCertificate=true;encrypt=false"
```
- IMPORTANT: Do NOT commit `.env`. Credentials are for dev convenience only.

3) Start SQL Server (via Docker) — optional
```bash
docker compose up -d mssql
# or: docker-compose up -d mssql
```
Defaults:
- Port: 1433
- SA_PASSWORD: env var `SA_PASSWORD` (defaults to `INse14ron.` in compose)

4) Prisma setup
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
Notes:
- The Prisma schema uses `provider = "sqlserver"` and reads `env("DATABASE_URL")`.
- Product items are stored as JSON-serialized strings (see `Order.productsJson`).

5) Run the app (with Socket.IO attached)
```bash
npm run dev:server
# or production-style
npm run build && npm start
```
Dev alternatives:
- `npm run dev` runs Next dev server without the custom Socket.IO server.

## Default Accounts
- Admin: `admin@csr.com` / `Admin@123`
- Agent: `agent@csr.com` / `Agent@123`

Seed data includes 50 sample orders across cities with mixed statuses and attempts.

## Scripts
- `npm run dev` — Next.js dev server (no Socket.IO)
- `npm run dev:server` — Custom Node server + Socket.IO (recommended in dev)
- `npm run build` — Next build
- `npm start` — Node `server.js` (Next + Socket.IO)
- `npm run prisma:generate` — Generate Prisma Client
- `npm run prisma:migrate` — Apply dev migrations
- `npm run prisma:seed` — Seed admin/agent users + sample orders
- `npm test` — Jest test skeleton

## Socket.IO
- Namespace: `/orders`
- Emits (scaffold): `newOrder`, `orderUpdated`, `assignmentChanged`, `orderConfirmed`, `orderCancelled`

## Project Notes
- Credentials must be stored in `.env` and never committed.
- The custom Node server (`server.js`) mounts Socket.IO and handles Next. This pattern is compatible with Node hosts (Render, Azure App Service, your server). Vercel does not support custom servers; deploy the frontend separately (or adapt Socket.IO to an external realtime service) if using Vercel.
- UI is scaffolded with Tailwind + shadcn. Components will expand as features are implemented.

## Troubleshooting
- If Prisma cannot connect, verify `DATABASE_URL`, the SQL Server is reachable, and `trustServerCertificate=true;encrypt=false` are set for local dev without TLS.
- If `docker compose up` fails healthcheck, increase retries or ensure port 1433 is free.

## License
Proprietary — internal project scaffold. Replace as needed.












