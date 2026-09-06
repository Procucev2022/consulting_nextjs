import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {
  calculateGzipSize,
  inspectAssetFile,
  evaluatePerformanceBudgets,
  formatBudgetReport
} from '../../src/utils/performanceBudget';
import { PERFORMANCE_BUDGETS } from '../../src/constants/performance';

describe('Performance Budget Utility (utils/performanceBudget.ts)', () => {
  const tempDir = path.resolve(__dirname, '../../test-temp-budget');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it('calculates gzip size accurately for string and buffer data', () => {
    const text = 'Hello Performance Budget! '.repeat(50);
    const sizeString = calculateGzipSize(text);
    const sizeBuffer = calculateGzipSize(Buffer.from(text, 'utf-8'));

    expect(sizeString).toBeGreaterThan(0);
    expect(sizeBuffer).toBe(sizeString);
    expect(sizeString).toBeLessThan(text.length);
  });

  it('inspects asset file correctly and returns null for non-existent file', () => {
    const testFile = path.join(tempDir, 'test-asset.js');
    fs.writeFileSync(testFile, 'console.log("budget test content");');

    const metric = inspectAssetFile(testFile, tempDir);
    expect(metric).not.toBeNull();
    expect(metric?.filePath).toBe(testFile);
    expect(metric?.rawBytes).toBeGreaterThan(0);
    expect(metric?.gzipBytes).toBeGreaterThan(0);
    expect(metric?.rawKb).toBeGreaterThan(0);

    const nonExistent = inspectAssetFile('does-not-exist.js', tempDir);
    expect(nonExistent).toBeNull();
  });

  it('handles error in inspectAssetFile gracefully when read fails', () => {
    const testFile = path.join(tempDir, 'error-asset.js');
    fs.writeFileSync(testFile, 'sample content');

    vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
      throw new Error('Disk read failure');
    });

    const result = inspectAssetFile(testFile, tempDir);
    expect(result).toBeNull();
  });

  it('returns failure when build manifest is missing', () => {
    const emptyDir = path.join(tempDir, 'empty-build');
    fs.mkdirSync(emptyDir, { recursive: true });

    const result = evaluatePerformanceBudgets({ baseDir: emptyDir });
    expect(result.success).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.summary).toContain('manifest missing');
  });

  it('evaluates performance budgets cleanly with mock build manifest and assets', () => {
    const mockBaseDir = path.join(tempDir, 'mock-app');
    const nextDir = path.join(mockBaseDir, '.next');
    const staticChunks = path.join(nextDir, 'static/chunks');
    const staticCss = path.join(nextDir, 'static/css');
    fs.mkdirSync(staticChunks, { recursive: true });
    fs.mkdirSync(staticCss, { recursive: true });

    fs.writeFileSync(path.join(staticCss, 'styles.css'), 'body { background: #000; }');
    fs.writeFileSync(path.join(staticChunks, 'webpack.js'), 'var __webpack_require__ = {};');
    fs.writeFileSync(path.join(staticChunks, 'vendor.js'), 'console.log("vendor library");');
    fs.writeFileSync(path.join(staticChunks, 'page.js'), 'console.log("page component");');

    const manifest = {
      pages: {
        '/layout': ['static/css/styles.css'],
        '/_not-found/page': ['static/chunks/webpack.js', 'static/chunks/vendor.js'],
        '/page': ['static/chunks/page.js']
      }
    };

    const result = evaluatePerformanceBudgets({
      baseDir: mockBaseDir,
      manifestOverride: manifest,
      limits: {
        maxJsBundleKb: 250,
        maxCriticalCssKb: 50,
        maxSharedJsChunkKb: 120,
        maxTotalPageJsKb: 320
      }
    });

    expect(result.success).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.criticalCssGzipKb).toBeGreaterThan(0);
    expect(result.totalSharedJsGzipKb).toBeGreaterThan(0);
    expect(result.totalPageJsGzipKb).toBeGreaterThan(0);
    expect(result.summary).toContain('All performance budgets passed');
  });

  it('detects violations when critical CSS, shared chunk, and total page JS exceed budget limits', () => {
    const mockBaseDir = path.join(tempDir, 'violating-app');
    const nextDir = path.join(mockBaseDir, '.next');
    const staticChunks = path.join(nextDir, 'static/chunks');
    const staticCss = path.join(nextDir, 'static/css');
    fs.mkdirSync(staticChunks, { recursive: true });
    fs.mkdirSync(staticCss, { recursive: true });

    // Large CSS content (~10 KB)
    const largeCss = 'h1 { color: red; }\n'.repeat(500);
    fs.writeFileSync(path.join(staticCss, 'heavy.css'), largeCss);

    // Heavy shared chunk
    const heavyJs = 'function heavyLogic() { return Math.random(); }\n'.repeat(500);
    fs.writeFileSync(path.join(staticChunks, 'heavy-vendor.js'), heavyJs);

    // Heavy page JS
    const heavyPage = 'console.log("page heavy");\n'.repeat(500);
    fs.writeFileSync(path.join(staticChunks, 'heavy-page.js'), heavyPage);

    const manifest = {
      pages: {
        '/layout': ['static/css/heavy.css'],
        '/_not-found/page': ['static/chunks/heavy-vendor.js'],
        '/page': ['static/chunks/heavy-page.js']
      }
    };

    // Provide tiny limits to force budget violations
    const result = evaluatePerformanceBudgets({
      baseDir: mockBaseDir,
      manifestOverride: manifest,
      limits: {
        maxCriticalCssKb: 0.01,
        maxSharedJsChunkKb: 0.01,
        maxJsBundleKb: 0.01,
        maxTotalPageJsKb: 0.01
      }
    });

    expect(result.success).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
    expect(result.summary).toContain('Performance budgets violated');
  });

  it('falls back to inspecting static/css directory when layout specifies no css files', () => {
    const mockBaseDir = path.join(tempDir, 'fallback-css-app');
    const nextDir = path.join(mockBaseDir, '.next');
    const staticCss = path.join(nextDir, 'static/css');
    fs.mkdirSync(staticCss, { recursive: true });

    fs.writeFileSync(path.join(staticCss, 'global-fallback.css'), 'body { margin: 0; }');

    const manifest = {
      pages: {
        '/layout': [],
        '/_not-found/page': [],
        '/page': []
      }
    };

    const result = evaluatePerformanceBudgets({
      baseDir: mockBaseDir,
      manifestOverride: manifest
    });

    expect(result.criticalCssGzipKb).toBeGreaterThan(0);
    expect(result.assetMetrics.some(m => m.filePath.includes('global-fallback.css'))).toBe(true);
  });

  it('reads manifest from file system and handles malformed JSON in app-build-manifest.json', () => {
    const mockBaseDir = path.join(tempDir, 'malformed-manifest-app');
    const nextDir = path.join(mockBaseDir, '.next');
    fs.mkdirSync(nextDir, { recursive: true });

    fs.writeFileSync(path.join(nextDir, 'app-build-manifest.json'), '{ not valid json');

    const result = evaluatePerformanceBudgets({ baseDir: mockBaseDir });
    expect(result.success).toBe(false);
    expect(result.violations[0].toLowerCase()).toContain('build manifest');
  });

  it('formats budget reports correctly for both pass and fail states', () => {
    const passResult = {
      success: true,
      totalSharedJsGzipKb: 100.5,
      criticalCssGzipKb: 13.8,
      totalPageJsGzipKb: 295.2,
      violations: [],
      summary: 'All passed',
      assetMetrics: [
        {
          filePath: 'static/chunks/main.js',
          rawBytes: 50000,
          gzipBytes: 15000,
          rawKb: 48.8,
          gzipKb: 14.6
        }
      ]
    };

    const passReport = formatBudgetReport(passResult);
    expect(passReport).toContain('PASSED (Clean)');
    expect(passReport).toContain('static/chunks/main.js');
    expect(passReport).toContain('All assets comply');

    const failResult = {
      success: false,
      totalSharedJsGzipKb: 280.0,
      criticalCssGzipKb: 75.0,
      totalPageJsGzipKb: 350.0,
      violations: ['Critical CSS budget exceeded: 75.0 KB (Limit: 50 KB)'],
      summary: 'Violations found',
      assetMetrics: []
    };

    const failReport = formatBudgetReport(failResult);
    expect(failReport).toContain('FAILED (Budget Exceeded)');
    expect(failReport).toContain('[FAIL] Critical CSS budget exceeded');
  });
});
