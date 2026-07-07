# Architecture & Stack

Understanding how ThiruXDB is built end-to-end to ensure high performance and maintainability.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite.
- **Styling:** Tailwind CSS (Frappe UI design principles), Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (native Node driver for maximum performance).
- **Security:** `jose` (Web Crypto JWTs), `bcryptjs` (Hashing), `express-rate-limit`.
- **Package Manager & Runtime:** Bun (for ultra-fast local development and package resolution).

## Monolithic Architecture

ThiruXDB operates as a seamless monolith to simplify deployment across serverless platforms like Netlify and Render.

```text
├── /src                # React Frontend (Dashboard, Docs, Landing)
│   ├── /components     # UI components (Frappe aesthetic)
│   ├── /pages          # Top level public routing pages
│   └── /context        # Global state (Theme, Auth)
├── /server             # Express Backend API
│   ├── /routes         # API endpoints (auth, endpoints, fetch, gateway)
│   ├── app.js          # Core Express application
│   └── index.js        # Serverless / Local entry point
└── netlify.toml        # Serverless function configuration
```

During a build, Vite compiles the `/src` React app into static assets in `/dist`. The Express backend serves these static files on the root `/` route, while all `/api/*` routes are handled by the backend logic. This ensures that the application can be hosted entirely on a single domain without CORS issues.
