import { describe, it, expect } from 'vitest';
import { LOG_SERIALIZATION } from '../../src/constants/logger';
import { createLogReplacer, serializeLogEntry, serializeLogValue } from '../../src/utils/logSerialization';
import type { LogEntry } from '../../src/types';

const TIMESTAMP = '2026-11-17T00:00:00.000Z';

const buildEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: TIMESTAMP,
  level: 'error',
  service: 'consulting-backend',
  environment: 'test',
  message: 'Operation failed',
  ...overrides
});

describe('log record serialization', () => {
  it('replaces a cycle with the circular marker and keeps the rest of the record', () => {
    const context: Record<string, unknown> = { tenantId: 'TNT-1' };
    context.self = context;

    const output = JSON.parse(serializeLogEntry(buildEntry({ context })));

    expect(output.context).toEqual({ tenantId: 'TNT-1', self: LOG_SERIALIZATION.circularMarker });
    expect(output.message).toBe('Operation failed');
    expect(output.timestamp).toBe(TIMESTAMP);
  });

  it('serializes a shared reference in full when it is not part of a cycle', () => {
    const shared = { code: 'SHARED' };

    const output = JSON.parse(serializeLogValue({ first: shared, second: shared }));

    expect(output).toEqual({ first: { code: 'SHARED' }, second: { code: 'SHARED' } });
  });

  it('encodes BigInt values as decimal strings', () => {
    expect(JSON.parse(serializeLogValue({ rows: 12n }))).toEqual({ rows: '12' });
  });

  it('encodes error values with name, message and stack', () => {
    const error = new TypeError('bad input');

    const output = JSON.parse(serializeLogValue({ error }));

    expect(output.error).toEqual({ name: 'TypeError', message: 'bad input', stack: error.stack });
  });

  it('keeps the core fields when a nested getter throws', () => {
    const context = {
      get broken(): never {
        throw new Error('getter failed');
      }
    };

    const output = JSON.parse(serializeLogEntry(buildEntry({ context })));

    expect(output).toEqual({
      timestamp: TIMESTAMP,
      level: 'error',
      service: 'consulting-backend',
      message: 'Operation failed',
      serializationWarning: LOG_SERIALIZATION.partialRecordMessage
    });
  });

  it('returns empty search text for a value that cannot be encoded', () => {
    const value = {
      get broken(): never {
        throw new Error('getter failed');
      }
    };

    expect(serializeLogValue(value)).toBe('');
  });

  it('marks only the repeated ancestor and leaves sibling branches encoded', () => {
    const replacer = createLogReplacer();
    const root: Record<string, unknown> = {};
    const branch: Record<string, unknown> = { leaf: 'value' };
    root.left = branch;
    root.right = { inner: branch };
    branch.parent = root;

    const output = JSON.parse(JSON.stringify(root, replacer));

    expect(output.left).toEqual({ leaf: 'value', parent: LOG_SERIALIZATION.circularMarker });
    expect(output.right).toEqual({ inner: { leaf: 'value', parent: LOG_SERIALIZATION.circularMarker } });
  });
});
