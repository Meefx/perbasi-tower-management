import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';
import { config } from 'dotenv';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';

config();

const runtimeEnvironment = (process.env.NODE_ENV ?? 'development').toLowerCase();

function getAuthSecret() {
	const secret = process.env.BETTER_AUTH_SECRET;
	const isBuildCommand = process.env.npm_lifecycle_event === 'build';

	if (secret) {
		return secret;
	}

	if (runtimeEnvironment === 'production' && !isBuildCommand) {
		throw new Error('BETTER_AUTH_SECRET is required when NODE_ENV=production.');
	}

	return 'development-secret-at-least-32-characters';
}

function getTrustedOrigins() {
	return (
		process.env.AUTH_TRUSTED_ORIGINS ??
		process.env.BETTER_AUTH_URL ??
		'http://localhost:5173'
	)
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function getDatabase() {
	if (runtimeEnvironment === 'production') {
		const connectionString = process.env.DATABASE_URL;

		if (!connectionString) {
			throw new Error('DATABASE_URL is required when NODE_ENV=production.');
		}

		return new Pool({ connectionString });
	}

	const databasePath = process.env.SQLITE_DATABASE_PATH ?? 'data/development.sqlite';
	const resolvedDatabasePath = resolve(databasePath);

	mkdirSync(dirname(resolvedDatabasePath), { recursive: true });

	return new Database(resolvedDatabasePath);
}

export const auth = betterAuth({
	appName: 'Perbasi Tower Management',
	baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
	secret: getAuthSecret(),
	trustedOrigins: getTrustedOrigins(),
	database: getDatabase(),
	emailAndPassword: {
		enabled: true,
		disableSignUp: process.env.AUTH_ENABLE_SIGNUP !== 'true',
		minPasswordLength: 8
	}
});
