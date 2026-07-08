# Security Overview

Security is a first-class citizen in ThiruXDB.

- **Zero-Config JWTs:** ThiruXDB uses the Node `jose` library to automatically generate, encrypt, and manage a secure JWT Secret Key using the Web Crypto API. No `.env` secrets required for JWT signing.
- **Session Hijacking Prevention:** Every JWT is cryptographically bound to the user's browser `User-Agent`. If a token is stolen and used on another device, it is instantly rejected.
- **Role-Based Access Control:** Native support for `admin`, `editor`, and `viewer` roles, with page-level restrictions available per user.
