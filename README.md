# ThiruXDB

> A self-hosted API data aggregation dashboard — configure external REST endpoints, fetch & store their data into MongoDB, browse and search records, all from a clean web UI.

---

## Features

- **Endpoint Manager** — Add, edit, activate/deactivate, and delete API endpoints with support for `None`, `Bearer`, `API Key`, and `Basic` authentication
- **Field Mappings** — Map and transform response fields (`string`, `number`, `boolean`, `date`) to a unified schema
- **One-click Fetch** — Pull data from a single endpoint or all active endpoints at once
- **Data Browser** — Paginated table/grid view with date range filters and full-text search (via MongoDB `$text` index)
- **Fetch Logs** — Complete history of every fetch operation with status, record counts, duration, and errors
- **Dashboard** — Live stats: total records, active endpoints, last sync time, and per-endpoint record distribution
- **Export** — Download current view as JSON or CSV
- **Local Auth** — Simple session-based admin login (no external auth service required)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Express.js |
| Database | MongoDB (via native `mongodb` driver) |
| Icons | Lucide React |

---

## Project Structure

```
ThiruXDB/
├── server/                  # Express API backend
│   ├── index.js             # Server entry point (port 3001)
│   ├── db.js                # MongoDB connection + index setup
│   └── routes/
│       ├── endpoints.js     # CRUD for api_endpoints collection
│       ├── records.js       # Paginated records, upsert, text search
│       ├── logs.js          # Fetch logs with endpoint name join
│       └── dashboard.js     # Aggregated stats in one round-trip
├── src/                     # React frontend
│   ├── lib/
│   │   └── api.ts           # Typed fetch client (replaces Supabase client)
│   ├── types/
│   │   └── database.ts      # Shared TypeScript interfaces
│   ├── context/
│   │   └── AuthContext.tsx  # Local session auth
│   └── components/
│       ├── DashboardPage.tsx
│       ├── EndpointsPage.tsx
│       ├── EndpointForm.tsx
│       ├── FetchPage.tsx
│       ├── DataBrowserPage.tsx
│       ├── LogsPage.tsx
│       ├── LoginPage.tsx
│       └── Layout.tsx
├── .env.example             # Environment variable template
├── vite.config.ts           # Vite + /api proxy config
└── package.json             # Bun scripts
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) `>= 1.0`
- A MongoDB instance — [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas) works great

### 1. Clone & Install

```bash
git clone https://github.com/ThiruXD/Endpoint-URL-Migration-To-MongoDB.git
cd Endpoint-URL-Migration-To-MongoDB
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=thiruXDB
PORT=3001
ADMIN_USERNAME=your_username_here
ADMIN_PASS=your_password_here
```

> **Note:** Bun loads `.env` automatically — no `dotenv` package required.

### 3. Run in Development

```bash
bun run dev
```

This starts both servers concurrently:
- **Vite** (frontend) → `http://localhost:5173`
- **Express API** → `http://localhost:3001`

Vite proxies all `/api/*` requests to the Express server, so the frontend just calls `/api/...`.

### 4. Login

Default credentials (change in `src/context/AuthContext.tsx`):

| Field | Value |
|---|---|
| Username | `your_username` |
| Password | `your_password` |

---

## MongoDB Collections

### `api_endpoints`
Stores configured API sources.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | string | Display name |
| `base_url` | string | The API URL to fetch |
| `auth_type` | string | `none` \| `api_key` \| `bearer` \| `basic` |
| `auth_config` | object | Auth credentials (headers, token, etc.) |
| `field_mappings` | array | Source → target field transform rules |
| `response_path` | string | Dot-path to array in response (e.g. `data.results`) |
| `pagination_type` | string | `none` \| `offset` \| `cursor` \| `page` |
| `is_active` | boolean | Whether endpoint is enabled |
| `last_fetched_at` | Date | Timestamp of last successful fetch |
| `last_error` | string | Last error message, if any |

### `data_records`
Stores fetched records from all endpoints.

| Field | Type | Description |
|---|---|---|
| `endpoint_id` | ObjectId | Reference to `api_endpoints` |
| `external_id` | string | Original `id` / `_id` from source API |
| `raw_data` | object | Complete original response item |
| `mapped_data` | object | Transformed data per field mappings |
| `_search_text` | string | Stringified raw_data for `$text` index |
| `fetched_at` | Date | When this record was fetched |

### `fetch_logs`
Tracks every fetch operation.

| Field | Type | Description |
|---|---|---|
| `endpoint_id` | ObjectId | Reference to `api_endpoints` |
| `status` | string | `success` \| `error` \| `partial` |
| `records_fetched` | number | Total items in API response |
| `records_created` | number | New records inserted |
| `records_updated` | number | Existing records updated |
| `duration_ms` | number | Total fetch duration |
| `error_message` | string | Error detail, if any |

---

## API Reference

All routes are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard` | All dashboard stats in one call |
| `GET` | `/api/endpoints` | List all endpoints |
| `POST` | `/api/endpoints` | Create endpoint |
| `PUT` | `/api/endpoints/:id` | Update endpoint |
| `PATCH` | `/api/endpoints/:id/toggle` | Toggle active state |
| `PATCH` | `/api/endpoints/:id/status` | Update last_fetched_at / last_error |
| `DELETE` | `/api/endpoints/:id` | Delete endpoint + cascade records & logs |
| `GET` | `/api/records` | List records (paginated, filterable) |
| `GET` | `/api/records/search` | Full-text search |
| `GET` | `/api/records/counts` | Total + per-endpoint record counts |
| `POST` | `/api/records` | Upsert a record |
| `PUT` | `/api/records/:id` | Update mapped_data |
| `DELETE` | `/api/records/:id` | Delete record |
| `GET` | `/api/logs` | List fetch logs |
| `POST` | `/api/logs` | Create fetch log entry |

---

## Available Scripts

```bash
bun run dev          # Start Vite + Express concurrently
bun run dev:client   # Vite only
bun run dev:server   # Express only (with --watch hot reload)
bun run build        # Production Vite build
bun run typecheck    # TypeScript type checking
bun run lint         # ESLint
```

---

## License

MIT
