# Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build shared email/password authentication for the management app and the Perbasi Tower Three.js website API.

**Architecture:** Better Auth owns credential and session lifecycle, mounted through SvelteKit `hooks.server.ts`. Application-specific auth code owns roles, actor resolution, authorization helpers, profile role data, `/api/me`, and management route guards. SQLite remains the development database and PostgreSQL remains the production database.

**Tech Stack:** SvelteKit, TypeScript, Better Auth, Kysely, better-sqlite3, pg, Vitest.

---

## File Structure

- Create `src/lib/server/auth/roles.ts`: role constants, role types, and validation helpers.
- Create `src/lib/server/auth/roles.spec.ts`: TDD coverage for role validation.
- Create `src/lib/server/auth/actor.ts`: actor types, guest/authenticated resolution, and `requireUser`/`requireRole`.
- Create `src/lib/server/auth/actor.spec.ts`: TDD coverage for actor and authorization behavior.
- Create `src/lib/server/auth/provider.ts`: Better Auth instance configured from environment and database driver.
- Create `src/lib/auth-client.ts`: browser Better Auth client for login/logout.
- Create `src/hooks.server.ts`: Better Auth SvelteKit handler and `event.locals` population.
- Modify `src/app.d.ts`: add typed `App.Locals`.
- Modify `src/lib/server/db/schema.ts`: add `user_profiles` table type.
- Modify `scripts/db-migrate.mjs`: create `user_profiles` and run Better Auth CLI migrations through npm scripts.
- Modify `package.json`: add Better Auth dependency and auth/database migration scripts.
- Modify `.env.example`: add auth secret/origin/seed variables.
- Create `src/routes/api/me/+server.ts`: current actor endpoint.
- Create `src/routes/api/me/response.ts`: pure response builder for unit tests.
- Create `src/routes/api/me/response.spec.ts`: TDD coverage for guest/authenticated response shape.
- Create `src/routes/login/+page.svelte`: login screen.
- Create `src/routes/(protected)/+layout.server.ts`: management route guard placeholder for protected routes.
- Create `src/routes/(protected)/dashboard/+page.svelte`: authenticated landing page.
- Modify `src/routes/+page.svelte`: link to login/dashboard.
- Update `README.md`: auth setup and commands.

---

### Task 1: Role Domain

**Files:**

- Create: `src/lib/server/auth/roles.spec.ts`
- Create: `src/lib/server/auth/roles.ts`

- [ ] **Step 1: Write failing role tests**

```ts
import { describe, expect, test } from 'vitest';

import { APPLICATION_ROLES, isApplicationRole, isPersistedRole, parsePersistedRole } from './roles';

describe('application roles', () => {
	test('includes guest and the persisted organization roles', () => {
		expect.assertions(2);

		expect(APPLICATION_ROLES).toContain('guest');
		expect(APPLICATION_ROLES).toContain('pengurus_departemen');
	});

	test('treats guest as an application role but not a persisted user role', () => {
		expect.assertions(2);

		expect(isApplicationRole('guest')).toBe(true);
		expect(isPersistedRole('guest')).toBe(false);
	});

	test('parses valid persisted roles and rejects invalid values', () => {
		expect.assertions(3);

		expect(parsePersistedRole('sponsor')).toBe('sponsor');
		expect(parsePersistedRole('guest')).toBeNull();
		expect(parsePersistedRole('unknown')).toBeNull();
	});
});
```

- [ ] **Step 2: Run role tests and verify RED**

Run: `npm run test:unit -- src/lib/server/auth/roles.spec.ts --run`

Expected: FAIL because `src/lib/server/auth/roles.ts` does not exist.

- [ ] **Step 3: Implement roles**

```ts
export const APPLICATION_ROLES = [
	'guest',
	'sponsor',
	'klub',
	'board',
	'executive',
	'pengurus_provinsi',
	'pengurus_kabupaten',
	'pengurus_zona',
	'pengurus_departemen'
] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];
export type PersistedRole = Exclude<ApplicationRole, 'guest'>;

export const PERSISTED_ROLES = APPLICATION_ROLES.filter(
	(role): role is PersistedRole => role !== 'guest'
);

export function isApplicationRole(value: unknown): value is ApplicationRole {
	return typeof value === 'string' && APPLICATION_ROLES.includes(value as ApplicationRole);
}

export function isPersistedRole(value: unknown): value is PersistedRole {
	return typeof value === 'string' && PERSISTED_ROLES.includes(value as PersistedRole);
}

export function parsePersistedRole(value: unknown): PersistedRole | null {
	return isPersistedRole(value) ? value : null;
}
```

- [ ] **Step 4: Run role tests and verify GREEN**

Run: `npm run test:unit -- src/lib/server/auth/roles.spec.ts --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add src/lib/server/auth/roles.ts src/lib/server/auth/roles.spec.ts
git commit -m "Add auth role domain"
```

---

### Task 2: Actor and Authorization Helpers

**Files:**

- Create: `src/lib/server/auth/actor.spec.ts`
- Create: `src/lib/server/auth/actor.ts`

- [ ] **Step 1: Write failing actor tests**

```ts
import { error } from '@sveltejs/kit';
import { describe, expect, test } from 'vitest';

import { getCurrentActor, requireRole, requireUser } from './actor';

describe('auth actor helpers', () => {
	test('returns guest actor when locals has no user', () => {
		expect.assertions(1);

		expect(getCurrentActor({})).toEqual({
			authenticated: false,
			role: 'guest'
		});
	});

	test('returns authenticated actor when locals has user and role', () => {
		expect.assertions(1);

		expect(
			getCurrentActor({
				user: { id: 'user_1', email: 'a@example.com', name: 'A User' },
				role: 'sponsor'
			})
		).toEqual({
			authenticated: true,
			user: { id: 'user_1', email: 'a@example.com', name: 'A User', role: 'sponsor' }
		});
	});

	test('requireUser throws 401 for guest', () => {
		expect.assertions(2);

		try {
			requireUser({});
		} catch (caught) {
			expect(caught).toMatchObject({ status: 401 });
			expect(caught).toBe(error(401, 'Authentication required.'));
		}
	});

	test('requireRole throws 403 for disallowed role', () => {
		expect.assertions(1);

		expect(() =>
			requireRole(
				{
					user: { id: 'user_1', email: 'a@example.com', name: 'A User' },
					role: 'klub'
				},
				['executive']
			)
		).toThrow();
	});
});
```

- [ ] **Step 2: Run actor tests and verify RED**

Run: `npm run test:unit -- src/lib/server/auth/actor.spec.ts --run`

Expected: FAIL because `src/lib/server/auth/actor.ts` does not exist.

- [ ] **Step 3: Implement actor helpers**

```ts
import { error } from '@sveltejs/kit';

import type { PersistedRole } from './roles';

export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string | null;
}

export interface AuthLocalsLike {
	user?: AuthenticatedUser;
	role?: PersistedRole;
}

export type GuestActor = {
	authenticated: false;
	role: 'guest';
};

export type AuthenticatedActor = {
	authenticated: true;
	user: AuthenticatedUser & { role: PersistedRole };
};

export type Actor = GuestActor | AuthenticatedActor;

export function getCurrentActor(locals: AuthLocalsLike): Actor {
	if (!locals.user || !locals.role) {
		return {
			authenticated: false,
			role: 'guest'
		};
	}

	return {
		authenticated: true,
		user: {
			...locals.user,
			role: locals.role
		}
	};
}

export function requireUser(locals: AuthLocalsLike): AuthenticatedActor {
	const actor = getCurrentActor(locals);

	if (!actor.authenticated) {
		throw error(401, 'Authentication required.');
	}

	return actor;
}

export function requireRole(
	locals: AuthLocalsLike,
	allowedRoles: readonly PersistedRole[]
): AuthenticatedActor {
	const actor = requireUser(locals);

	if (!allowedRoles.includes(actor.user.role)) {
		throw error(403, 'Insufficient permissions.');
	}

	return actor;
}
```

- [ ] **Step 4: Run actor tests and verify GREEN**

Run: `npm run test:unit -- src/lib/server/auth/actor.spec.ts --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add src/lib/server/auth/actor.ts src/lib/server/auth/actor.spec.ts
git commit -m "Add auth actor helpers"
```

---

### Task 3: Better Auth Provider, Schema, and Migrations

**Files:**

- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/lib/server/db/schema.ts`
- Modify: `scripts/db-migrate.mjs`
- Create: `src/lib/server/auth/provider.ts`

- [ ] **Step 1: Install Better Auth**

Run: `npm install better-auth`

Expected: `better-auth` appears in `dependencies` and `package-lock.json` changes.

- [ ] **Step 2: Add env variables**

Add these values to `.env.example`:

```txt
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:5173
AUTH_TRUSTED_ORIGINS=http://localhost:5173
AUTH_SEED_EMAIL=admin@example.com
AUTH_SEED_PASSWORD=change-this-password
AUTH_SEED_NAME=Perbasi Admin
AUTH_SEED_ROLE=executive
```

- [ ] **Step 3: Add user profile schema type**

Add this property to `DatabaseSchema`:

```ts
user_profiles: {
	user_id: string;
	role: PersistedRole;
	display_name: string | null;
	created_at: string;
	updated_at: string;
}
```

Also import `PersistedRole` from `src/lib/server/auth/roles`.

- [ ] **Step 4: Create Better Auth provider**

```ts
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';
import { betterAuth } from 'better-auth';

const runtimeEnvironment = (process.env.NODE_ENV ?? 'development').toLowerCase();

function getTrustedOrigins() {
	return (
		process.env.AUTH_TRUSTED_ORIGINS ??
		process.env.BETTER_AUTH_URL ??
		'http://localhost:5173'
	)
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function getDatabase() {
	if (runtimeEnvironment === 'production') {
		const connectionString = process.env.DATABASE_URL;

		if (!connectionString) {
			throw new Error('DATABASE_URL is required when NODE_ENV=production.');
		}

		return new Pool({ connectionString });
	}

	const databasePath = process.env.SQLITE_DATABASE_PATH ?? 'data/development.sqlite';
	const resolvedDatabasePath = resolve(databasePath);

	mkdirSync(dirname(resolvedDatabasePath), { recursive: true });

	return new Database(resolvedDatabasePath);
}

export const auth = betterAuth({
	appName: 'Perbasi Tower Management',
	baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: getTrustedOrigins(),
	database: getDatabase(),
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		minPasswordLength: 8
	}
});
```

- [ ] **Step 5: Update migration script**

Add `user_profiles` table creation for SQLite and PostgreSQL. Keep `app_metadata`. Better Auth auth tables are created by the new `auth:migrate:*` npm scripts.

SQLite SQL:

```sql
create table if not exists user_profiles (
	user_id text primary key,
	role text not null check (
		role in (
			'sponsor',
			'klub',
			'board',
			'executive',
			'pengurus_provinsi',
			'pengurus_kabupaten',
			'pengurus_zona',
			'pengurus_departemen'
		)
	),
	display_name text,
	created_at text not null default current_timestamp,
	updated_at text not null default current_timestamp
);
```

PostgreSQL SQL:

```sql
create table if not exists user_profiles (
	user_id text primary key,
	role text not null check (
		role in (
			'sponsor',
			'klub',
			'board',
			'executive',
			'pengurus_provinsi',
			'pengurus_kabupaten',
			'pengurus_zona',
			'pengurus_departemen'
		)
	),
	display_name text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);
```

- [ ] **Step 6: Add package scripts**

Add scripts:

```json
"auth:migrate": "auth migrate --config src/lib/server/auth/provider.ts --yes",
"auth:migrate:dev": "cross-env NODE_ENV=development auth migrate --config src/lib/server/auth/provider.ts --yes",
"auth:migrate:prod": "cross-env NODE_ENV=production auth migrate --config src/lib/server/auth/provider.ts --yes"
```

- [ ] **Step 7: Run migrations**

Run:

```sh
npm run auth:migrate:dev
npm run db:migrate:dev
```

Expected: Better Auth tables and `user_profiles` exist in `data/development.sqlite`.

- [ ] **Step 8: Commit**

```sh
git add package.json package-lock.json .env.example src/lib/server/db/schema.ts scripts/db-migrate.mjs src/lib/server/auth/provider.ts
git commit -m "Configure Better Auth database"
```

---

### Task 4: SvelteKit Hooks, Locals, and Profile Lookup

**Files:**

- Create: `src/hooks.server.ts`
- Modify: `src/app.d.ts`
- Create: `src/lib/server/auth/profile.ts`

- [ ] **Step 1: Create profile lookup helper**

```ts
import { getDb } from '$lib/server/db';

import { parsePersistedRole } from './roles';

export async function getUserRole(userId: string) {
	const profile = await getDb()
		.selectFrom('user_profiles')
		.select(['role'])
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return parsePersistedRole(profile?.role);
}
```

- [ ] **Step 2: Add App.Locals types**

```ts
import type { Session, User } from 'better-auth';
import type { PersistedRole } from '$lib/server/auth/roles';

declare global {
	namespace App {
		interface Locals {
			session?: Session;
			user?: Pick<User, 'id' | 'email' | 'name'>;
			role?: PersistedRole;
		}
	}
}

export {};
```

- [ ] **Step 3: Create server hook**

```ts
import { building } from '$app/environment';
import { auth } from '$lib/server/auth/provider';
import { getUserRole } from '$lib/server/auth/profile';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name
		};
		event.locals.role = await getUserRole(session.user.id);
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
```

- [ ] **Step 4: Run typecheck**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add src/hooks.server.ts src/app.d.ts src/lib/server/auth/profile.ts
git commit -m "Populate auth locals"
```

---

### Task 5: Current Actor API

**Files:**

- Create: `src/routes/api/me/response.spec.ts`
- Create: `src/routes/api/me/response.ts`
- Create: `src/routes/api/me/+server.ts`

- [ ] **Step 1: Write failing response tests**

```ts
import { describe, expect, test } from 'vitest';

import { buildMeResponse } from './response';

describe('/api/me response', () => {
	test('returns guest response', () => {
		expect.assertions(1);

		expect(buildMeResponse({ authenticated: false, role: 'guest' })).toEqual({
			authenticated: false,
			role: 'guest'
		});
	});

	test('returns authenticated response', () => {
		expect.assertions(1);

		expect(
			buildMeResponse({
				authenticated: true,
				user: {
					id: 'user_1',
					email: 'a@example.com',
					name: 'A User',
					role: 'executive'
				}
			})
		).toEqual({
			authenticated: true,
			user: {
				id: 'user_1',
				email: 'a@example.com',
				name: 'A User',
				role: 'executive'
			}
		});
	});
});
```

- [ ] **Step 2: Run response tests and verify RED**

Run: `npm run test:unit -- src/routes/api/me/response.spec.ts --run`

Expected: FAIL because `response.ts` does not exist.

- [ ] **Step 3: Implement response builder and endpoint**

```ts
import type { Actor } from '$lib/server/auth/actor';

export function buildMeResponse(actor: Actor) {
	return actor;
}
```

```ts
import { json } from '@sveltejs/kit';

import { getCurrentActor } from '$lib/server/auth/actor';

import { buildMeResponse } from './response';

export function GET({ locals }) {
	return json(buildMeResponse(getCurrentActor(locals)));
}
```

- [ ] **Step 4: Run response tests and verify GREEN**

Run: `npm run test:unit -- src/routes/api/me/response.spec.ts --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add src/routes/api/me src/lib/server/auth/actor.ts
git commit -m "Add current actor API"
```

---

### Task 6: Login and Protected Management Routes

**Files:**

- Create: `src/lib/auth-client.ts`
- Create: `src/routes/login/+page.svelte`
- Create: `src/routes/(protected)/+layout.server.ts`
- Create: `src/routes/(protected)/dashboard/+page.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create auth client**

```ts
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient();
```

- [ ] **Step 2: Create login page**

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';

	let email = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let pending = $state(false);

	async function submit() {
		pending = true;
		errorMessage = '';

		const result = await authClient.signIn.email({
			email,
			password
		});

		pending = false;

		if (result.error) {
			errorMessage = result.error.message ?? 'Login failed.';
			return;
		}

		await goto('/dashboard');
	}
</script>

<main>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			void submit();
		}}
	>
		<h1>Login</h1>
		<label>
			Email
			<input bind:value={email} type="email" autocomplete="email" required />
		</label>
		<label>
			Password
			<input bind:value={password} type="password" autocomplete="current-password" required />
		</label>
		{#if errorMessage}
			<p role="alert">{errorMessage}</p>
		{/if}
		<button disabled={pending}>{pending ? 'Signing in...' : 'Sign in'}</button>
	</form>
</main>
```

- [ ] **Step 3: Create protected layout guard**

```ts
import { redirect } from '@sveltejs/kit';

import { getCurrentActor } from '$lib/server/auth/actor';

export function load({ locals }) {
	const actor = getCurrentActor(locals);

	if (!actor.authenticated) {
		throw redirect(303, '/login');
	}

	return {
		actor
	};
}
```

- [ ] **Step 4: Create dashboard page**

```svelte
<script lang="ts">
	let { data } = $props();
</script>

<main>
	<h1>Dashboard</h1>
	<p>{data.actor.user.email}</p>
	<p>{data.actor.user.role}</p>
</main>
```

- [ ] **Step 5: Update home page links**

Add links to `/login`, `/dashboard`, and `/api/me` using `resolve()`.

- [ ] **Step 6: Run checks**

Run:

```sh
npm run check
npm run lint
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```sh
git add src/lib/auth-client.ts src/routes/login src/routes/'(protected)' src/routes/+page.svelte
git commit -m "Add login and protected dashboard"
```

---

### Task 7: Seed User and Documentation

**Files:**

- Create: `scripts/auth-seed.mjs`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Create seed script**

Use Better Auth API to create the first user, then insert or update `user_profiles`.

The script must:

- Load `.env`.
- Validate `AUTH_SEED_EMAIL`, `AUTH_SEED_PASSWORD`, `AUTH_SEED_NAME`, `AUTH_SEED_ROLE`.
- Reject `guest` or invalid roles.
- Call Better Auth sign-up API or server API.
- Insert/update `user_profiles`.

- [ ] **Step 2: Add package scripts**

```json
"auth:seed": "node scripts/auth-seed.mjs",
"auth:seed:dev": "cross-env NODE_ENV=development node scripts/auth-seed.mjs"
```

- [ ] **Step 3: Update README**

Document:

```sh
npm run auth:migrate:dev
npm run db:migrate:dev
npm run auth:seed:dev
npm run dev
```

Also document that the Three.js website must call APIs with credentials.

- [ ] **Step 4: Run seed locally**

Run: `npm run auth:seed:dev`

Expected: seed user is created or updated without duplicate failure.

- [ ] **Step 5: Commit**

```sh
git add scripts/auth-seed.mjs package.json README.md
git commit -m "Add auth seed workflow"
```

---

### Task 8: Final Verification

**Files:**

- No new files.

- [ ] **Step 1: Run full verification**

Run:

```sh
npm run check
npm run lint
npm run test
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Verify development auth health manually**

Run the dev server and check:

```sh
Invoke-RestMethod -Uri 'http://127.0.0.1:5173/api/me' | ConvertTo-Json -Depth 4
```

Expected unauthenticated response:

```json
{
	"authenticated": false,
	"role": "guest"
}
```

- [ ] **Step 3: Commit any verification-only docs fixes**

Only commit if final verification required small doc/config fixes.

- [ ] **Step 4: Push branch**

Push the completed branch after verification passes.
