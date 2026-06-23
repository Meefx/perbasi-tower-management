import type { Actor } from '$lib/server/auth/actor';

export function buildMeResponse(actor: Actor) {
	return actor;
}
