# Getting Started

ThiruXDB is a powerful, self-hosted API data aggregation hub. It allows you to consume data from any REST API, structure it into MongoDB, and serve it blazingly fast through a public gateway.

## What does it solve?

Modern applications frequently rely on third-party APIs (e.g., weather data, stock prices, anime databases, ecommerce product catalogs). However, fetching directly from these APIs in production introduces significant issues:

- **Strict Rate Limits:** You might be limited to 60 requests per minute.
- **High Latency:** Waiting for the 3rd party API delays your own app's response.
- **No Querying:** Many APIs don't offer advanced filtering, sorting, or pagination.

**ThiruXDB solves this.** You configure the endpoint in ThiruXDB. ThiruXDB runs a sync job to pull the data into your own MongoDB. You then serve this data to your users instantly, with built-in querying, and without ever hitting the 3rd party API limits.

## Quick Setup

```bash
# Clone the repository
git clone https://github.com/ThiruXD/ThiruXDB.git
cd ThiruXDB

# Install dependencies using Bun
bun install

# Setup Environment Variables
cp .env.example .env
# Edit .env with your MongoDB URI

# Start the development server
bun run dev
```
