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
