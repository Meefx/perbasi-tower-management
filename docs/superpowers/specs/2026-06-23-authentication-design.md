# Authentication Design

## Context

Perbasi Tower Management is the admin management application and API backend for the Perbasi Tower Three.js website. The backend must authenticate users, expose session-aware API endpoints, and later authorize access to floor-specific data.

This first auth phase builds the shared authentication foundation for both the management app and the Three.js website.

## Goals

- Add email/password authentication.
- Support logged-in users across the management app and external Three.js website fetches.
- Represent the initial role set in application code and persisted user data.
- Treat unauthenticated requests as `guest`.
- Provide server-side helpers for route/API protection.
- Provide a simple authenticated identity API for the Three.js website.
- Keep the design ready for later floor-level authorization.

## Non-Goals

- Floor access assignment UI.
- Detailed floor data CRUD.
- Password reset and email delivery.
- Social login.
- Multi-factor authentication.
- Full audit logging.

## Roles

The application role set is:

- `guest`
- `sponsor`
- `klub`
- `board`
- `executive`
- `pengurus_provinsi`
- `pengurus_kabupaten`
- `pengurus_zona`
- `pengurus_departemen`

`guest` is not stored as a database user role. It is the runtime actor state for requests without a valid session. Persisted users must have one of the non-guest roles.

## Recommended Approach

Use Better Auth with database-backed sessions and secure cookies.

Reasons:

- It has official SvelteKit integration.
- Session records can be revoked from the database.
- Cookie-based sessions work naturally for the management app.
- Server hooks can populate `event.locals` for route guards and API handlers.
- The auth API surface can be shared by the Three.js website when it fetches with credentials.

JWT-only auth is not the default for this phase because role and floor access may change after login. Database sessions make revocation and permission changes easier to enforce.

## Architecture

### Auth Provider

Better Auth owns the core auth tables, password handling, session creation, and auth routes under `/api/auth/*`.

The SvelteKit `hooks.server.ts` file will:

- Mount the Better Auth handler.
- Read the current session from the request headers.
- Populate `event.locals.session`.
- Populate `event.locals.user`.
- Populate an application actor object that always resolves to either a logged-in user or `guest`.

### Application Profile

Application-specific user data is kept separate from the auth provider tables. The profile stores:

- User id linked to the auth user id.
- Role.
- Display name or organization label if needed.
- Timestamps.

This keeps auth provider implementation details separate from authorization rules.

### Authorization Helpers

Server-only helpers will provide:

- `getCurrentActor(event.locals)` for guest or authenticated actor resolution.
- `requireUser(event.locals)` for endpoints/routes that require login.
- `requireRole(event.locals, roles)` for role-restricted server logic.

The helpers return explicit 401/403 errors so route handlers stay small and consistent.

### Public Identity API

Add `/api/me` for the Three.js website and management app to inspect the current actor.

For unauthenticated requests it returns a guest actor:

```json
{
	"authenticated": false,
	"role": "guest"
}
```

For authenticated requests it returns:

```json
{
	"authenticated": true,
	"user": {
		"id": "auth-user-id",
		"email": "user@example.com",
		"name": "User Name",
		"role": "sponsor"
	}
}
```

The external Three.js website must send requests with credentials when using cookie sessions.

## Data Flow

1. User submits email/password to the Better Auth sign-in endpoint or login page action.
2. Better Auth validates credentials and sets a session cookie.
3. Future requests include that cookie.
4. `hooks.server.ts` resolves the session and user.
5. Application auth helpers load the profile role.
6. Routes and API endpoints authorize based on the resolved actor.

## Initial Admin Access

The first implementation should include a development seed mechanism for creating an initial login user from environment variables:

- `AUTH_SEED_EMAIL`
- `AUTH_SEED_PASSWORD`
- `AUTH_SEED_NAME`
- `AUTH_SEED_ROLE`

The seed role must be one of the non-guest roles. For the first admin-style account, use `executive` unless configured otherwise.

## Environment

Add:

- `AUTH_SECRET`
- `AUTH_TRUSTED_ORIGINS`
- `AUTH_SEED_EMAIL`
- `AUTH_SEED_PASSWORD`
- `AUTH_SEED_NAME`
- `AUTH_SEED_ROLE`

`AUTH_TRUSTED_ORIGINS` will allow the management app origin and, later, the Three.js website origin.

## Error Handling

- Unauthenticated protected management routes redirect to `/login`.
- Unauthenticated protected API routes return 401.
- Authenticated users without the required role return 403.
- `/api/me` never errors for missing auth; it returns the guest actor.
- Missing production auth secrets should fail fast at startup or first auth initialization.

## Testing

Use TDD for implementation.

Initial test coverage:

- Role constants reject invalid persisted `guest` role.
- Actor resolution returns guest when no session exists.
- Actor resolution returns authenticated actor with role when user/profile exists.
- Authorization helper throws 401 for guest on `requireUser`.
- Authorization helper throws 403 for disallowed role.
- `/api/me` returns guest without session.

Full browser login tests can be added after the login UI exists.

## Future Floor Authorization

Future floor authorization should add separate tables for floor definitions and role/user floor access. Auth helpers should remain focused on identity and role checks, while floor-specific checks live in a dedicated authorization module.
