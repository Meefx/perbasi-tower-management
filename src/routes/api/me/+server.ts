import { json } from '@sveltejs/kit';

import { getCurrentActor } from '$lib/server/auth/actor';

import { buildMeResponse } from './response';

export function GET({ locals }) {
	return json(buildMeResponse(getCurrentActor(locals)));
}
