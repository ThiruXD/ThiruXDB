# Public API Gateway

Once your data is synced into MongoDB, you can serve it to your frontend applications using the Public API Gateway.

## Generating API Keys

Navigate to the **System Security** tab in the Dashboard. Here you can generate new API keys with specific:

- **Rate Limits:** Limit requests per second, minute, or hour.
- **Quotas:** Limit total requests per day, week, or month.
- **Expirations:** Auto-expire keys after a set duration.

## Using the Gateway

Make a GET request to the gateway endpoint, passing your API key in the headers:

```http
GET /api/v1/public/thiruxdb_data_records?_page=1&_limit=20
Authorization: Bearer txdb_key_XXXXXXXXXXXXXXXXXXXX
```

> **Pro Tip:** You can pass dynamic MongoDB filters directly in the URL! For example, `?status=active&category=shoes` automatically translates to a MongoDB query.
