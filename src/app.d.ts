// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AuthenticatedUser } from '$lib/server/auth/actor';
import type { PersistedRole } from '$lib/server/auth/roles';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: unknown;
			user?: AuthenticatedUser;
			role?: PersistedRole | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
