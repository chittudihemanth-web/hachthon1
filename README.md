# PulseFlow AI — Monorepo Architecture

PulseFlow AI is built with an enterprise-grade, clean separation of concerns dividing the system into distinct **Frontend**, **Backend**, and **Shared** packages.

```
pulseflow/
├── frontend/               # React 19 Client SPA
│   ├── src/
│   │   ├── components/     # UI Design System & Layout components
│   │   ├── pages/          # Dashboard, Workflows, Executions, HITL, Analytics, Settings
│   │   ├── hooks/          # TanStack Query v5 hooks (communicating with Backend)
│   │   ├── store/          # Zustand global UI state
│   │   └── types/          # Frontend domain interfaces
│   ├── vite.config.ts      # Vite 8 dev server with /api proxy to http://localhost:3001
│   ├── tailwind.config.js  # Cyberpunk / neon design system
│   └── package.json        # Frontend dependencies
│
├── backend/                # Express & Node.js AI Orchestration Server
│   ├── src/
│   │   ├── config/         # Environment variables & runtime settings
│   │   ├── db/             # Storage layer (In-memory + Seed Data + Supabase ready)
│   │   ├── services/
│   │   │   ├── orchestrator.ts # Autonomous Pipeline Execution Engine
│   │   │   ├── gemini.ts       # Google Gen AI SDK harness (Gemini 2.5 Pro & Flash)
│   │   │   └── dispatcher.ts   # Integration dispatcher (Slack, CRM, Webhooks)
│   │   ├── routes/         # REST API endpoints (/api/workflows, /api/executions, /api/hitl, etc.)
│   │   ├── middlewares/    # Helmet security, Rate limiting, Request logger, Error handler
│   │   └── server.ts       # Express server listening on port 3001
│   └── package.json        # Backend dependencies
│
├── shared/                 # Shared domain contracts and type definitions
│   └── types.ts            # Canonical domain models (Workflows, Executions, HITL, Telemetry)
│
└── package.json            # Monorepo root with unified developer scripts
```

---

## ⚡ Quick Start

### 1. Run Both Simultaneously (Recommended)
From `pulseflow/`:
```bash
# Terminal 1: Run Backend
npm run dev:backend

# Terminal 2: Run Frontend
npm run dev:frontend
```

### 2. Available Ports
- **Frontend SPA**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

---

## 🛡️ Architecture & Responsibilities

| Dimension | Frontend (`frontend/`) | Backend (`backend/`) |
| :--- | :--- | :--- |
| **Technology** | React 19, TypeScript, Vite 8, Tailwind CSS | Node.js v20+, Express.js, TypeScript (`tsx`), Zod |
| **State Management** | Zustand (UI state) + TanStack Query v5 (Server cache) | In-Memory Database + Persistent Seed + Supabase ready |
| **Primary Role** | Visual workflow builder, execution trace inspector, HITL approval interface, real-time telemetry charts | Workflow orchestration engine, LLM prompt engineering, entity extraction, confidence routing, external dispatches |
| **Security Layer** | Client-side validation, sanitized JSON payload renders | Helmet headers, CORS policies, IP Rate Limiting (120 req/min) |
| **AI Integration** | Displays confidence meters & model metadata | Direct `@google/genai` SDK execution using Gemini 2.5 Pro & Flash |
