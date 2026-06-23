import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';
import { config } from 'dotenv';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

config();

const PERSISTED_ROLES = [
	'sponsor',
	'klub',
	'board',
	'executive',
	'pengurus_provinsi',
	'pengurus_kabupaten',
	'pengurus_zona',
	'pengurus_departemen'
];

const runtimeEnvironment = (process.env.NODE_ENV ?? 'development').toLowerCase();

function readRequiredEnv(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required.`);
	}

	return value;
}

function getAuthSecret() {
	const secret = process.env.BETTER_AUTH_SECRET;

	if (secret) {
		return secret;
	}

	if (runtimeEnvironment === 'production') {
		throw new Error('BETTER_AUTH_SECRET is required when NODE_ENV=production.');
	}

	return 'development-secret-at-least-32-characters';
}

function getDatabase() {
	if (runtimeEnvironment === 'production') {
		const connectionString = readRequiredEnv('DATABASE_URL');
		return new pg.Pool({ connectionString });
	}

	const databasePath = process.env.SQLITE_DATABASE_PATH ?? 'data/development.sqlite';
	const resolvedDatabasePath = resolve(databasePath);

	mkdirSync(dirname(resolvedDatabasePath), { recursive: true });

	return new Database(resolvedDatabasePath);
}

function assertPersistedRole(role) {
	if (!PERSISTED_ROLES.includes(role)) {
		throw new Error(`AUTH_SEED_ROLE must be one of: ${PERSISTED_ROLES.join(', ')}.`);
	}
}

async function findUserIdByEmail(database, email) {
	if (runtimeEnvironment === 'production') {
		const result = await database.query('select id from "user" where email = $1 limit 1', [email]);
		return result.rows[0]?.id ?? null;
	}

	return database.prepare('select id from "user" where email = ? limit 1').get(email)?.id ?? null;
}

async function upsertUserProfile(database, userId, role, displayName) {
	if (runtimeEnvironment === 'production') {
		await database.query(
			`
				insert into user_profiles (user_id, role, display_name)
				values ($1, $2, $3)
				on conflict (user_id) do update set
					role = excluded.role,
					display_name = excluded.display_name,
					updated_at = now()
			`,
			[userId, role, displayName]
		);
		return;
	}

	database
		.prepare(
			`
				insert into user_profiles (user_id, role, display_name)
				values (?, ?, ?)
				on conflict (user_id) do update set
					role = excluded.role,
					display_name = excluded.display_name,
					updated_at = current_timestamp
			`
		)
		.run(userId, role, displayName);
}

async function main() {
	const email = readRequiredEnv('AUTH_SEED_EMAIL');
	const password = readRequiredEnv('AUTH_SEED_PASSWORD');
	const name = process.env.AUTH_SEED_NAME ?? 'Perbasi Admin';
	const role = process.env.AUTH_SEED_ROLE ?? 'executive';

	assertPersistedRole(role);

	const database = getDatabase();
	const auth = betterAuth({
		appName: 'Perbasi Tower Management',
		baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
		secret: getAuthSecret(),
		database,
		emailAndPassword: {
			enabled: true,
			disableSignUp: false,
			minPasswordLength: 8
		}
	});

	try {
		let userId = await findUserIdByEmail(database, email);

		if (!userId) {
			const result = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name
				}
			});

			userId = result.user.id;
			console.log(`Created seed user ${email}.`);
		} else {
			console.log(`Seed user ${email} already exists.`);
		}

		await upsertUserProfile(database, userId, role, name);
		console.log(`Seed user profile is set to role ${role}.`);
	} finally {
		if (runtimeEnvironment === 'production') {
			await database.end();
		} else {
			database.close();
		}
	}
}

await main();
