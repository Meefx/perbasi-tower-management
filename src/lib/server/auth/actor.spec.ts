import { describe, expect, test } from 'vitest';

import { getCurrentActor, requireRole, requireUser } from './actor';

describe('auth actor helpers', () => {
	test('returns guest actor when locals has no user', () => {
		expect.assertions(1);

		expect(getCurrentActor({})).toEqual({
			authenticated: false,
			role: 'guest'
		});
	});

	test('returns authenticated actor when locals has user and role', () => {
		expect.assertions(1);

		expect(
			getCurrentActor({
				user: { id: 'user_1', email: 'a@example.com', name: 'A User' },
				role: 'sponsor'
			})
		).toEqual({
			authenticated: true,
			user: { id: 'user_1', email: 'a@example.com', name: 'A User', role: 'sponsor' }
		});
	});

	test('requireUser throws 401 for guest', () => {
		expect.assertions(2);

		try {
			requireUser({});
		} catch (caught) {
			expect(caught).toMatchObject({ status: 401 });
			expect(caught).toMatchObject({ body: { message: 'Authentication required.' } });
		}
	});

	test('requireRole throws 403 for disallowed role', () => {
		expect.assertions(2);

		try {
			requireRole(
				{
					user: { id: 'user_1', email: 'a@example.com', name: 'A User' },
					role: 'klub'
				},
				['executive']
			);
		} catch (caught) {
			expect(caught).toMatchObject({ status: 403 });
			expect(caught).toMatchObject({ body: { message: 'Insufficient permissions.' } });
		}
	});
});
