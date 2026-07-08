# Sync Engine

The Sync Engine is responsible for pulling data from your endpoints and intelligently upserting it into your database.

## How it works

When a sync is triggered:

1. The backend queries the endpoint configuration, including HTTP headers and JSON extraction paths.
2. An asynchronous `fetch` request is made to the external provider.
3. The engine parses the response array and prepares a massive MongoDB `bulkWrite` operation.
4. Records are `upserted` (Insert if new, Update if exists) matching on a unique identifier defined in your configuration. This prevents duplicates.
