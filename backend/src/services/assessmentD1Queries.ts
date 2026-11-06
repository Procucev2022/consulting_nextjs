import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1Record } from '../types/d1';

export const queryAll = async <T = D1Record>(
  db: CloudflareD1Database,
  sql: string,
  values: unknown[] = []
): Promise<T[]> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  const result = await bound.all<T>();
  return result.results || [];
};

export const queryFirst = async <T = D1Record>(
  db: CloudflareD1Database,
  sql: string,
  values: unknown[] = []
): Promise<T | null> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  return bound.first<T>();
};
