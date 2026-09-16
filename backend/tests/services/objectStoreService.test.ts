import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObjectStoreService } from '../../src/services/objectStoreService';
import fs from 'fs';
import path from 'path';

describe('ObjectStoreService with Cloudflare R2 and Local Fallback', () => {
  const testDir = path.resolve(process.cwd(), 'storage', 'test-objects');
  let store: ObjectStoreService;

  beforeEach(() => {
    store = new ObjectStoreService(testDir, 'test-bucket');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors in test
      }
    }
  });

  it('correctly reports R2 configuration based on environment variables', () => {
    expect(typeof store.isR2Configured()).toBe('boolean');
  });

  it('stores and retrieves objects in memory and local store', async () => {
    const fileContent = Buffer.from('Material,Quantity,Price\nHDPE,100,50');
    const filename = 'dataset_sample.csv';

    const putResult = await store.putObject(fileContent, filename, 'text/csv', 'test-bucket', {
      source: 'upload-test'
    });

    expect(putResult.key).toContain('test-bucket');
    expect(putResult.filename).toBe('dataset_sample.csv');
    expect(putResult.sizeBytes).toBe(fileContent.length);
    expect(putResult.storageUrl).toBe(`/api/documents/storage/${encodeURIComponent(putResult.key)}`);

    const getResult = await store.getObject(putResult.key);
    expect(getResult).not.toBeNull();
    expect(getResult?.buffer.toString('utf-8')).toBe('Material,Quantity,Price\nHDPE,100,50');
    expect(getResult?.metadata.filename).toBe('dataset_sample.csv');
  });

  it('lists stored objects', async () => {
    const fileContent = Buffer.from('PO,Vendor,Spend\n1,VendorA,1000');
    await store.putObject(fileContent, 'sample1.csv', 'text/csv', 'test-bucket');

    const list = await store.listObjects('test-bucket');
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((item) => item.filename === 'sample1.csv')).toBe(true);
  });

  it('deletes stored objects', async () => {
    const fileContent = Buffer.from('test data');
    const putResult = await store.putObject(fileContent, 'delete_target.txt', 'text/plain', 'test-bucket');

    const deleteSuccess = await store.deleteObject(putResult.key);
    expect(deleteSuccess).toBe(true);

    const getAfterDelete = await store.getObject(putResult.key);
    expect(getAfterDelete).toBeNull();
  });
});
