import { error } from '@sveltejs/kit';

import type { PersistedRole } from './roles';

export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string | null;
}

export interface AuthLocalsLike {
	user?: AuthenticatedUser;
	role?: PersistedRole | null;
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
