import { describe, expect, it, vi } from 'vitest';
import { queryAll, queryFirst } from '../../src/services/assessmentD1Queries';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

const createDatabase = (results?: unknown[], firstResult: unknown = null) => {
  const statement = {
    all: vi.fn(async () => ({ results })),
    bind: vi.fn(function (this: unknown) { return this; }),
    first: vi.fn(async () => firstResult)
  };
  const database = { prepare: vi.fn(() => statement) } as unknown as CloudflareD1Database;
  return { database, statement };
};

describe('assessment D1 query helpers', () => {
  it('binds values for list queries and returns their rows', async () => {
    const row = { assessment_id: 'A1' };
    const { database, statement } = createDatabase([row]);

    await expect(queryAll(database, 'SELECT * FROM AssessmentRecord WHERE tenant_id = ?', ['T1']))
      .resolves.toEqual([row]);
    expect(database.prepare).toHaveBeenCalledWith('SELECT * FROM AssessmentRecord WHERE tenant_id = ?');
    expect(statement.bind).toHaveBeenCalledWith('T1');
    expect(statement.all).toHaveBeenCalledOnce();
  });

  it('uses unbound list queries and returns an empty list when D1 omits results', async () => {
    const { database, statement } = createDatabase(undefined);

    await expect(queryAll(database, 'SELECT * FROM AssessmentRecord')).resolves.toEqual([]);
    expect(statement.bind).not.toHaveBeenCalled();
  });

  it('binds values for first-row queries', async () => {
    const row = { assessment_id: 'A1' };
    const { database, statement } = createDatabase(undefined, row);

    await expect(queryFirst(database, 'SELECT * FROM AssessmentRecord WHERE assessment_id = ?', ['A1']))
      .resolves.toEqual(row);
    expect(statement.bind).toHaveBeenCalledWith('A1');
    expect(statement.first).toHaveBeenCalledOnce();
  });

  it('uses unbound first-row queries and preserves a missing row result', async () => {
    const { database, statement } = createDatabase();

    await expect(queryFirst(database, 'SELECT * FROM AssessmentRecord')).resolves.toBeNull();
    expect(statement.bind).not.toHaveBeenCalled();
  });
});
