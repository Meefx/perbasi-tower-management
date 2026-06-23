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
