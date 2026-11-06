const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// SQLite strings can contain semicolons, comments, and newlines. Split only at
// statement boundaries so imported customer text is never truncated or altered.
const splitSqlStatements = (source) => {
  const statements = [];
  let start = 0;
  let quote = null;
  let comment = null;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (comment === 'line') {
      if (character === '\n') comment = null;
    } else if (comment === 'block') {
      if (character === '*' && next === '/') { comment = null; index += 1; }
    } else if (quote) {
      if (character === quote && next === quote) index += 1;
      else if (character === quote) quote = null;
    } else if (character === '-' && next === '-') {
      comment = 'line'; index += 1;
    } else if (character === '/' && next === '*') {
      comment = 'block'; index += 1;
    } else if (character === "'" || character === '"' || character === '`') {
      quote = character;
    } else if (character === ';') {
      const statement = source.slice(start, index + 1).trim();
      if (!/^(?:BEGIN(?: TRANSACTION)?|COMMIT);$/iu.test(statement)) statements.push(statement);
      start = index + 1;
    }
  }
  if (quote || comment === 'block') throw new Error('D1 seed contains an unterminated string or comment');
  const remainder = source.slice(start).trim();
  if (remainder && !/^(?:--[^\n]*(?:\n|$)|\s)*$/u.test(remainder)) {
    throw new Error('D1 seed contains a statement without a terminating semicolon');
  }
  return statements;
};

const readSqlString = (statement, start) => {
  if (statement[start] !== "'") throw new Error('Unsupported oversized D1 seed statement');
  let value = '';
  for (let index = start + 1; index < statement.length; index += 1) {
    if (statement[index] === "'" && statement[index + 1] === "'") {
      value += "'";
      index += 1;
    } else if (statement[index] === "'") {
      return { value, next: index + 1 };
    } else {
      value += statement[index];
    }
  }
  throw new Error('D1 seed contains an unterminated string');
};

const quoteSqlString = (value) => `'${value.replaceAll("'", "''")}'`;

const splitUtf8Text = (value, maxBytes) => {
  const chunks = [];
  let chunk = '';
  let chunkBytes = 0;
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character, 'utf8');
    if (chunk && chunkBytes + characterBytes > maxBytes) {
      chunks.push(chunk);
      chunk = '';
      chunkBytes = 0;
    }
    chunk += character;
    chunkBytes += characterBytes;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
};

const splitLargeAssessmentStoreInsert = (statement, byteLimit) => {
  const upper = statement.toUpperCase();
  const valuesIndex = upper.indexOf(' VALUES');
  if (!upper.startsWith('INSERT OR IGNORE INTO ASSESSMENTSTOREENTRY ') || valuesIndex < 0) {
    throw new Error('A D1 seed statement exceeds the configured import part limit');
  }

  const header = statement.slice(0, valuesIndex).trim();
  let cursor = valuesIndex + ' VALUES'.length;
  while (/\s/u.test(statement[cursor] || '')) cursor += 1;
  if (statement[cursor] !== '(') throw new Error('Unsupported oversized D1 assessment store row');
  cursor += 1;

  const values = [];
  for (let index = 0; index < 5; index += 1) {
    while (/\s/u.test(statement[cursor] || '')) cursor += 1;
    const parsed = readSqlString(statement, cursor);
    values.push(parsed.value);
    cursor = parsed.next;
    while (/\s/u.test(statement[cursor] || '')) cursor += 1;
    if (index < 4) {
      if (statement[cursor] !== ',') throw new Error('Unsupported oversized D1 assessment store row');
      cursor += 1;
    }
  }
  while (/\s/u.test(statement[cursor] || '')) cursor += 1;
  if (statement[cursor] !== ')' || statement.slice(cursor + 1).trim() !== ';') {
    throw new Error('Unsupported oversized D1 assessment store row');
  }

  const [entryType, assessmentId, entryId, payload, sourceChecksum] = values;
  const chunkBytes = Math.min(12000, Math.floor(byteLimit / 8));
  const chunks = splitUtf8Text(payload, chunkBytes);
  if (chunks.length === 0) throw new Error('Oversized D1 assessment payload is empty');

  const keyValues = [entryType, assessmentId, entryId, sourceChecksum].map(quoteSqlString);
  const statements = chunks.map((chunk, index) =>
    `INSERT OR IGNORE INTO D1SeedPayloadChunk (entry_type, assessment_id, entry_id, source_checksum, chunk_index, payload_part) VALUES (${[
      ...keyValues, String(index), quoteSqlString(chunk)
    ].join(', ')});`
  );
  statements.push(
    `${header} SELECT ${keyValues.slice(0, 3).join(', ')}, ` +
    `(SELECT group_concat(payload_part, '') FROM (SELECT payload_part FROM D1SeedPayloadChunk ` +
    `WHERE entry_type = ${keyValues[0]} AND assessment_id = ${keyValues[1]} AND entry_id = ${keyValues[2]} ` +
    `AND source_checksum = ${keyValues[3]} ORDER BY chunk_index)), ${keyValues[3]};`
  );
  statements.push(
    `DELETE FROM D1SeedPayloadChunk WHERE entry_type = ${keyValues[0]} AND assessment_id = ${keyValues[1]} ` +
    `AND entry_id = ${keyValues[2]} AND source_checksum = ${keyValues[3]};`
  );
  return statements;
};

const splitSeedParts = (source, byteLimit) => {
  if (!Number.isInteger(byteLimit) || byteLimit <= 0) throw new Error('D1 seed part limit must be a positive integer');
  const parts = [];
  let part = '';
  let partBytes = 0;
  const oversizedStatementBytes = Math.min(byteLimit, 100000);
  const statements = splitSqlStatements(source).flatMap((statement) => {
    const bytes = Buffer.byteLength(`${statement}\n\n`, 'utf8');
    if (bytes > oversizedStatementBytes) return splitLargeAssessmentStoreInsert(statement, byteLimit);
    return [statement];
  });
  for (const statement of statements) {
    const bytes = Buffer.byteLength(`${statement}\n\n`, 'utf8');
    if (bytes > byteLimit) throw new Error('A D1 seed statement exceeds the configured import part limit');
    if (partBytes + bytes > byteLimit) { parts.push(part); part = ''; partBytes = 0; }
    part += `${statement}\n\n`;
    partBytes += bytes;
  }
  if (part) parts.push(part);
  return parts;
};

const verifySeedManifest = (backendRoot) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(backendRoot, 'd1-seed-manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.seedFiles) || manifest.seedFiles.length === 0 || !manifest.files) {
    throw new Error('D1 seed manifest must list the canonical seed files');
  }
  for (const fileName of manifest.seedFiles) {
    if (typeof fileName !== 'string' || path.basename(fileName) !== fileName || !manifest.files[fileName]) {
      throw new Error('D1 seed manifest contains an invalid file path');
    }
  }
  for (const [fileName, expected] of Object.entries(manifest.files)) {
    if (path.basename(fileName) !== fileName) throw new Error('D1 seed manifest contains an invalid file path');
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(backendRoot, fileName))).digest('hex');
    if (actual !== expected) throw new Error(`D1 seed checksum mismatch: ${fileName}`);
  }
  return manifest;
};

const shouldSeedDatabase = (args) => args.includes('--seed') || args.includes('--seed-all');

const quoteSqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;

const getSeedFileLedgerReadSql = (fileName) =>
  `SELECT/**/source_checksum/**/FROM/**/D1SeedFileLedger/**/WHERE/**/seed_file=${quoteSqlLiteral(fileName)};`;

const getSeedFileLedgerWriteSql = (fileName, checksum) =>
  `INSERT INTO D1SeedFileLedger (seed_file, source_checksum) VALUES ` +
  `(${quoteSqlLiteral(fileName)}, ${quoteSqlLiteral(checksum)}) ` +
  'ON CONFLICT(seed_file) DO UPDATE SET source_checksum = excluded.source_checksum, applied_at = CURRENT_TIMESTAMP;';

const getWranglerSqlInputArgs = (sql, filePath, jsonOutput) =>
  jsonOutput ? ['--command', sql] : [`--file=${filePath}`];

const parseWranglerJsonOutput = (stdout) => {
  const output = String(stdout).trim();
  const starts = [...output.matchAll(/\[/gu)].map((match) => match.index).reverse();
  let foundArray = false;
  for (const start of starts) {
    let candidate;
    try {
      candidate = JSON.parse(output.slice(start));
    } catch {
      continue;
    }
    if (!Array.isArray(candidate)) continue;
    foundArray = true;
    if (candidate.every((result) => result && result.success === true && Array.isArray(result.results))) {
      return candidate.flatMap((result) => result.results);
    }
  }

  if (foundArray) throw new Error('Wrangler D1 query returned an unsuccessful result');
  try {
    const result = JSON.parse(output);
    if (!Array.isArray(result)) throw new Error('Wrangler D1 query returned an invalid result set');
  } catch (error) {
    if (error instanceof Error && error.message === 'Wrangler D1 query returned an invalid result set') throw error;
    throw new Error('Wrangler D1 query did not return valid JSON');
  }
  throw new Error('Wrangler D1 query returned an unsuccessful result');
};

const isSeedFileApplied = (rows, checksum) =>
  Array.isArray(rows) && rows.some((row) => row && row.source_checksum === checksum);

module.exports = {
  splitSqlStatements,
  splitSeedParts,
  verifySeedManifest,
  shouldSeedDatabase,
  getSeedFileLedgerReadSql,
  getSeedFileLedgerWriteSql,
  getWranglerSqlInputArgs,
  parseWranglerJsonOutput,
  isSeedFileApplied
};
