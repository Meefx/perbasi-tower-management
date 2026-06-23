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
