import { describe, expect, test } from 'vitest';

import { buildMeResponse } from './response';

describe('/api/me response', () => {
	test('returns guest response', () => {
		expect.assertions(1);

		expect(buildMeResponse({ authenticated: false, role: 'guest' })).toEqual({
			authenticated: false,
			role: 'guest'
		});
	});

	test('returns authenticated response', () => {
		expect.assertions(1);

		expect(
			buildMeResponse({
				authenticated: true,
				user: {
					id: 'user_1',
					email: 'a@example.com',
					name: 'A User',
					role: 'executive'
				}
			})
		).toEqual({
			authenticated: true,
			user: {
				id: 'user_1',
				email: 'a@example.com',
				name: 'A User',
				role: 'executive'
			}
		});
	});
});
