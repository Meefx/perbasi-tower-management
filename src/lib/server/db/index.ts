import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pg from 'pg';
import { Kysely, PostgresDialect, SqliteDialect, sql } from 'kysely';
import { env } from '$env/dynamic/private';

import type { DatabaseSchema } from './schema';

const { Pool } = pg;

type RuntimeEnvironment = 'development' | 'production';

let db: Kysely<DatabaseSchema> | undefined;

export function getRuntimeEnvironment(): RuntimeEnvironment {
	return (env.NODE_ENV ?? process.env.NODE_ENV ?? 'development').toLowerCase() === 'production'
		? 'production'
		: 'development';
}

export function getDatabaseClientName() {
	return getRuntimeEnvironment() === 'production' ? 'postgresql' : 'sqlite';
}

export function getDb() {
	if (db) {
		return db;
	}

	if (getRuntimeEnvironment() === 'production') {
		const connectionString = env.DATABASE_URL ?? process.env.DATABASE_URL;

		if (!connectionString) {
			throw new Error('DATABASE_URL is required when NODE_ENV=production.');
		}

		db = new Kysely<DatabaseSchema>({
			dialect: new PostgresDialect({
				pool: new Pool({ connectionString })
			})
		});

		return db;
	}

	const databasePath =
		env.SQLITE_DATABASE_PATH ?? process.env.SQLITE_DATABASE_PATH ?? 'data/development.sqlite';
	const resolvedDatabasePath = resolve(databasePath);

	mkdirSync(dirname(resolvedDatabasePath), { recursive: true });

	db = new Kysely<DatabaseSchema>({
		dialect: new SqliteDialect({
			database: new Database(resolvedDatabasePath)
		})
	});

	return db;
}

export async function checkDatabaseConnection() {
	await sql`select 1 as ok`.execute(getDb());

	return {
		client: getDatabaseClientName(),
		environment: getRuntimeEnvironment()
	};
}
