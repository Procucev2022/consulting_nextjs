/**
 * Log record serialization (Backend)
 *
 * A logging call must never throw into application code. Circular references, BigInt values, and
 * getters that throw would make a plain JSON.stringify fail and drop the record. Every log sink encodes
 * through the helpers in this module instead.
 */
import { LOG_SERIALIZATION } from '../constants/logger';
import type { LogEntry } from '../types';

type LogReplacer = (this: unknown, key: string, value: unknown) => unknown;

const toSerializableError = (error: Error): Record<string, unknown> => ({
  name: error.name,
  message: error.message,
  stack: error.stack
});

/**
 * Tracks the objects on the path currently being serialized. An object that appears again inside its own
 * subtree is a cycle and is replaced by a marker. A shared reference that is not a cycle serializes in full.
 */
export const createLogReplacer = (): LogReplacer => {
  const ancestors: unknown[] = [];
  return function replaceLogValue(this: unknown, _key: string, value: unknown): unknown {
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Error) return toSerializableError(value);
    if (typeof value !== 'object' || value === null) return value;
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) ancestors.pop();
    if (ancestors.includes(value)) return LOG_SERIALIZATION.circularMarker;
    ancestors.push(value);
    return value;
  };
};

/**
 * Encodes a complete log record. When a field cannot be encoded, the core fields are still written so the
 * event remains visible in the log stream.
 */
export const serializeLogEntry = (entry: Partial<LogEntry>): string => {
  try {
    return JSON.stringify(entry, createLogReplacer());
  } catch {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      service: entry.service,
      message: entry.message,
      serializationWarning: LOG_SERIALIZATION.partialRecordMessage
    });
  }
};

/**
 * Encodes a single value for keyword search. Values that cannot be encoded match no keyword.
 */
export const serializeLogValue = (value: unknown): string => {
  try {
    return JSON.stringify(value, createLogReplacer());
  } catch {
    return '';
  }
};
