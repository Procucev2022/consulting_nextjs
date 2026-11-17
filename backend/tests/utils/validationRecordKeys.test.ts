import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { D1_VALIDATION_RECORD_ID_PREFIX, D1_VALIDATION_RECORD_ROW_SEGMENT } from '../../src/constants/d1';
import { validationRecordKeyRange } from '../../src/utils/validationRecordKeys';

const DATA_VERSION_ID = 'DV-1';
const TENANT_ID = 'TNT-1';

const KEYS_IN_TABLE = [
  `${D1_VALIDATION_RECORD_ID_PREFIX}${DATA_VERSION_ID}${D1_VALIDATION_RECORD_ROW_SEGMENT}-1`,
  `${D1_VALIDATION_RECORD_ID_PREFIX}${DATA_VERSION_ID}${D1_VALIDATION_RECORD_ROW_SEGMENT}-2`,
  `${D1_VALIDATION_RECORD_ID_PREFIX}${DATA_VERSION_ID}${D1_VALIDATION_RECORD_ROW_SEGMENT}-`,
  `${D1_VALIDATION_RECORD_ID_PREFIX}DV-10${D1_VALIDATION_RECORD_ROW_SEGMENT}-1`,
  `${D1_VALIDATION_RECORD_ID_PREFIX}${DATA_VERSION_ID}${D1_VALIDATION_RECORD_ROW_SEGMENT}S-1`,
  `${D1_VALIDATION_RECORD_ID_PREFIX}${DATA_VERSION_ID}${D1_VALIDATION_RECORD_ROW_SEGMENT}.1`,
  `${D1_VALIDATION_RECORD_ID_PREFIX}dv-1${D1_VALIDATION_RECORD_ROW_SEGMENT}-3`
];

const EXPECTED_MATCHES = KEYS_IN_TABLE.slice(0, 3);

describe('validation record key ranges', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('CREATE TABLE ValidationPreCheckRecord (record_id TEXT PRIMARY KEY NOT NULL, tenant_id TEXT NOT NULL)');
    const insert = database.prepare('INSERT INTO ValidationPreCheckRecord (record_id, tenant_id) VALUES (?, ?)');
    for (const key of KEYS_IN_TABLE) insert.run(key, TENANT_ID);
  });

  afterEach(() => {
    database.close();
  });

  it('builds bounds that cover every row key of one data version and nothing else', () => {
    const range = validationRecordKeyRange(DATA_VERSION_ID);
    const matches = database.prepare('SELECT record_id FROM ValidationPreCheckRecord WHERE record_id >= ? AND record_id < ? ORDER BY record_id')
      .all(range.lowerBound, range.upperBound)
      .map((row) => String(row.record_id));

    expect(matches).toEqual([...EXPECTED_MATCHES].sort());
  });

  it('matches keys by exact case, so a range for one spelling skips keys that differ only by case', () => {
    const range = validationRecordKeyRange('dv-1');
    const matches = database.prepare('SELECT record_id FROM ValidationPreCheckRecord WHERE record_id >= ? AND record_id < ?')
      .all(range.lowerBound, range.upperBound);

    expect(matches.map((row) => String(row.record_id))).toEqual([KEYS_IN_TABLE[6]]);
  });

  it('lets SQLite seek the primary-key index instead of scanning the table', () => {
    const range = validationRecordKeyRange(DATA_VERSION_ID);
    const plan = database.prepare('EXPLAIN QUERY PLAN SELECT record_id FROM ValidationPreCheckRecord WHERE record_id >= ? AND record_id < ?')
      .all(range.lowerBound, range.upperBound)
      .map((row) => String(row.detail));

    expect(plan.join(' ')).toMatch(/SEARCH .*USING (COVERING )?INDEX/u);
    expect(plan.join(' ')).not.toMatch(/SCAN ValidationPreCheckRecord(?! USING)/u);
  });
});
