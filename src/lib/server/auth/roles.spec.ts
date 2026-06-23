import { describe, expect, test } from 'vitest';

import {
	APPLICATION_ROLES,
	isApplicationRole,
	isPersistedRole,
	parsePersistedRole
} from './roles';

describe('application roles', () => {
	test('includes guest and the persisted organization roles', () => {
		expect.assertions(2);

		expect(APPLICATION_ROLES).toContain('guest');
		expect(APPLICATION_ROLES).toContain('pengurus_departemen');
	});

	test('treats guest as an application role but not a persisted user role', () => {
		expect.assertions(2);

		expect(isApplicationRole('guest')).toBe(true);
		expect(isPersistedRole('guest')).toBe(false);
	});

	test('parses valid persisted roles and rejects invalid values', () => {
		expect.assertions(3);

		expect(parsePersistedRole('sponsor')).toBe('sponsor');
		expect(parsePersistedRole('guest')).toBeNull();
		expect(parsePersistedRole('unknown')).toBeNull();
	});
});
