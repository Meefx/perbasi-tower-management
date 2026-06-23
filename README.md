# Perbasi Tower Management

SvelteKit application for Perbasi Tower Management.

## Stack

- SvelteKit with TypeScript
- Adapter Node for production builds
- Kysely database layer
- SQLite for development
- PostgreSQL for production
- ESLint, Prettier, and Vitest

## Environment

Copy `.env.example` to `.env` and adjust values as needed.

Development uses SQLite:

```sh
NODE_ENV=development
SQLITE_DATABASE_PATH=data/development.sqlite
```

Production uses PostgreSQL:

```sh
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/perbasi_tower_management
```

Authentication uses Better Auth:

```sh
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:5173
AUTH_TRUSTED_ORIGINS=http://localhost:5173
AUTH_SEED_EMAIL=admin@example.com
AUTH_SEED_PASSWORD=change-this-password
AUTH_SEED_NAME=Perbasi Admin
AUTH_SEED_ROLE=executive
```

## Development

Install dependencies:

```sh
npm install
```

Create or update the development database and auth tables:

```sh
npm run auth:migrate:dev
npm run db:migrate:dev
```

Create or update the initial development login:

```sh
npm run auth:seed:dev
```

Run the application:

```sh
npm run dev
```

Check database connectivity:

```txt
http://localhost:5173/api/health/db
```

Check current auth actor:

```txt
http://localhost:5173/api/me
```

The Perbasi Tower Three.js website should call session-aware endpoints with credentials enabled so browser cookies are sent with API requests.

## Production

Set `NODE_ENV=production`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `AUTH_TRUSTED_ORIGINS`, then run the PostgreSQL migrations:

```sh
npm run auth:migrate:prod
npm run db:migrate:prod
```

Build and preview:

```sh
npm run build
npm run preview
```
