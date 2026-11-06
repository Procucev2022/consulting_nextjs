import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CategoryMappingRow {
  material_group_code: string;
  category_name: string;
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): { all(): CategoryMappingRow[] };
  close(): void;
}

interface SqliteModule {
  DatabaseSync: new (path: string) => SqliteDatabase;
}

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as SqliteModule;
const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(fixtureDirectory, '../../backend');

export const getD1CategoryMappingsFixture = (): Record<string, string> => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(fs.readFileSync(path.join(backendDirectory, 'd1-schema.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(backendDirectory, 'd1-category-mapping-seed.sql'), 'utf8'));
    const rows = database.prepare(
      'SELECT material_group_code, category_name FROM ProcurementCategoryMapping'
    ).all();
    return Object.fromEntries(rows.map((row) => [row.material_group_code, row.category_name]));
  } finally {
    database.close();
  }
};
