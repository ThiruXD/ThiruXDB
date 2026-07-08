# Development & Contributing

Whether you are a developer looking to extend ThiruXDB or just looking to understand the codebase, this guide covers the core workflow.

## Local Development Workflow

ThiruXDB uses `bun` to run both the React frontend and the Express backend simultaneously during development.

```bash
bun run dev
```

This command runs `bun run dev:server & bun run dev:client`. The frontend runs on `localhost:5173` and the API runs on `localhost:3000`. The Vite config automatically proxies `/api` requests to the backend.

## Modifying the Database Schema

ThiruXDB uses the native `mongodb` driver. Because there are no rigid ORMs (like Mongoose or Prisma), modifying collections is as simple as inserting new fields. All collections use the `thiruxdb_` prefix.

## Contributing Guidelines

1. **Fork the repository** and create your feature branch (`git checkout -b feature/AmazingFeature`).
2. **Adhere to Frappe UI design principles.** Use neutral grays, subtle borders (`border-gray-200`), and minimalist elements. Avoid vibrant colors or heavy drop-shadows.
3. **Keep the bundle small.** Do not install heavy dependencies unless strictly necessary.
4. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`).
5. **Push to the branch** and open a Pull Request!
