export interface LocalD1Statement {
  all(...values: unknown[]): unknown[];
  run(...values: unknown[]): unknown;
}

export interface LocalD1Database {
  prepare(sql: string): LocalD1Statement;
  close(): void;
}

export interface LocalD1Module {
  DatabaseSync: new (path: string, options: { readOnly: boolean }) => LocalD1Database;
}
