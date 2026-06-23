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
