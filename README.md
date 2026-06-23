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

## Development

Install dependencies:

```sh
npm install
```

Create or update the development database:

```sh
npm run db:migrate:dev
```

Run the application:

```sh
npm run dev
```

Check database connectivity:

```txt
http://localhost:5173/api/health/db
```

## Production

Set `NODE_ENV=production` and `DATABASE_URL`, then run the PostgreSQL migration:

```sh
npm run db:migrate:prod
```

Build and preview:

```sh
npm run build
npm run preview
```
