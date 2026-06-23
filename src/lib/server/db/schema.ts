import type { PersistedRole } from '$lib/server/auth/roles';

export interface DatabaseSchema {
	app_metadata: {
		key: string;
		value: string;
		created_at: string;
		updated_at: string;
	};
	user_profiles: {
		user_id: string;
		role: PersistedRole;
		display_name: string | null;
		created_at: string;
		updated_at: string;
	};
}
