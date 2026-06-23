import { json } from '@sveltejs/kit';

import { checkDatabaseConnection } from '$lib/server/db';

export async function GET() {
	try {
		const database = await checkDatabaseConnection();

		return json({
			status: 'ok',
			database
		});
	} catch (error) {
		return json(
			{
				status: 'error',
				message: error instanceof Error ? error.message : 'Database connection failed.'
			},
			{ status: 500 }
		);
	}
}
