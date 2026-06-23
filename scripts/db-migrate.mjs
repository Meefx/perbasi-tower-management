import Database from 'better-sqlite3';
import { config } from 'dotenv';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

config();

const runtimeEnvironment = (process.env.NODE_ENV ?? 'development').toLowerCase();

if (runtimeEnvironment === 'production') {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL is required when NODE_ENV=production.');
	}

	const pool = new pg.Pool({ connectionString });

	try {
		await pool.query(`
			create table if not exists app_metadata (
				key text primary key,
				value text not null,
				created_at timestamptz not null default now(),
				updated_at timestamptz not null default now()
			);
		`);

		console.log('PostgreSQL migration completed.');
	} finally {
		await pool.end();
	}
} else {
	const databasePath = process.env.SQLITE_DATABASE_PATH ?? 'data/development.sqlite';
	const resolvedDatabasePath = resolve(databasePath);

	mkdirSync(dirname(resolvedDatabasePath), { recursive: true });

	const db = new Database(resolvedDatabasePath);

	try {
		db.exec(`
			create table if not exists app_metadata (
				key text primary key,
				value text not null,
				created_at text not null default current_timestamp,
				updated_at text not null default current_timestamp
			);
		`);

		console.log(`SQLite migration completed at ${resolvedDatabasePath}.`);
	} finally {
		db.close();
	}
}
