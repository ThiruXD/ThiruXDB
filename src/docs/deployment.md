# Deployment

ThiruXDB can be easily deployed to modern serverless and PaaS platforms. Below are the recommended deployment strategies, ranging from Serverless functions to Persistent Docker environments.

## Persistent Servers (Render, Railway, VPS)

For production environments handling continuous background syncs, **Persistent Servers** are highly recommended. Unlike Serverless, persistent servers do not sleep between requests, allowing ThiruXDB's internal `setInterval` sync engine to run reliably.

### Deploying to Render / Railway

ThiruXDB is built to automatically serve the React frontend alongside the Express API when running in a standard Node.js environment.

1. Connect your GitHub repository to your Render or Railway dashboard.
2. Set the build command to: `bun run build`
3. Set the start command to: `bun run start` (or `node server/index.js`)
4. Add your Environment Variables (`MONGODB_URI`, `JWT_SECRET`, etc.).
5. Deploy! ThiruXDB will start the API server and serve your frontend static files directly.

### Docker (Self-Hosted VPS)

You can easily package ThiruXDB inside a Docker container for VPS environments (DigitalOcean, AWS EC2, Linode).

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .
RUN bun run build

EXPOSE 3001

CMD ["bun", "run", "start"]
```

## Vercel / Netlify (Serverless)

ThiruXDB is natively configured to run on Serverless platforms like Vercel and Netlify out of the box! The repository includes a `vercel.json` config and an `api/index.js` serverless endpoint that perfectly bridges the Express backend with Vercel's Node.js runtime.

1. Connect your GitHub repository to Vercel or Netlify.
2. Set your **Environment Variables** (`MONGODB_URI`, `JWT_SECRET`).
3. Deploy! The platform will automatically build the React frontend and configure the Serverless API endpoints.

> **Note on Serverless Syncing:** Because serverless functions spin down after responding to a request, ThiruXDB's internal background sync engine will only trigger when the API is actively receiving traffic. For strict cron-based syncing, a persistent server is required.

## Why no Cloudflare Workers support?

Currently, ThiruXDB cannot be deployed directly to Cloudflare Workers or Cloudflare Pages Functions. 

This limitation stems from the **MongoDB Node.js Driver**. The official MongoDB driver relies heavily on native Node.js core modules (such as `net`, `tls`, `dns`, and `crypto`) to establish binary TCP connections to your database cluster. 

Cloudflare Workers operate in a specialized V8 isolate environment that does not fully support these native Node.js TCP streams out-of-the box without complex tunneling (like `cloudflared`) or using HTTP-based REST data APIs. Because ThiruXDB prioritizes robust database querying and aggregation, it requires a standard Node.js runtime (Vercel, Netlify, Render, or Docker).
