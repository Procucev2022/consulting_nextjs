/**
 * Frontend Client-Side Performance Budget Enforcement Utility
 *
 * Inspects production build artifacts (.next) for JavaScript bundles and critical CSS,
 * validates against strict performance budgets, logs structured metrics, and flags violations.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { PERFORMANCE_BUDGETS } from '../constants';
import type {
  PerformanceBudgetLimits,
  AssetSizeMetric,
  PerformanceBudgetCheckResult
} from '../types';
import { frontendLogger } from './logger';

export function calculateGzipSize(data: Buffer | string): number {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
  const compressed = zlib.gzipSync(buffer);
  return compressed.length;
}

export function inspectAssetFile(filePath: string, baseDir: string = process.cwd()): AssetSizeMetric | null {
  try {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    const content = fs.readFileSync(resolvedPath);
    const rawBytes = content.length;
    const gzipBytes = calculateGzipSize(content);
    return {
      filePath,
      rawBytes,
      gzipBytes,
      rawKb: Number((rawBytes / 1024).toFixed(2)),
      gzipKb: Number((gzipBytes / 1024).toFixed(2))
    };
  } catch (error) {
    frontendLogger.error('Failed to inspect asset file for performance budget', {
      error,
      context: { filePath, baseDir }
    });
    return null;
  }
}

interface BuildManifest {
  pages?: Record<string, string[]>;
}

function resolveManifest(baseDir: string, override?: unknown): BuildManifest | null {
  if (override && typeof override === 'object') {
    return override as BuildManifest;
  }
  const manifestPath = path.resolve(baseDir, '.next/app-build-manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as BuildManifest;
    } catch (err) {
      frontendLogger.warn('Unable to parse app-build-manifest.json', { error: err });
    }
  }
  return null;
}

function checkCriticalCss(
  manifest: BuildManifest,
  baseDir: string,
  limitKb: number,
  assetMetrics: AssetSizeMetric[],
  violations: string[]
): number {
  const layoutFiles: string[] = manifest.pages?.['/layout'] || [];
  const cssFiles = layoutFiles.filter((f: string) => f.endsWith('.css'));

  if (cssFiles.length === 0) {
    const cssDir = path.resolve(baseDir, '.next/static/css');
    if (fs.existsSync(cssDir)) {
      const dirFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
      dirFiles.forEach((f) => cssFiles.push(`static/css/${f}`));
    }
  }

  let totalBytes = 0;
  for (const cssFile of cssFiles) {
    const metric = inspectAssetFile(path.join('.next', cssFile), baseDir);
    if (metric) {
      totalBytes += metric.gzipBytes;
      assetMetrics.push(metric);
    }
  }

  const criticalCssGzipKb = Number((totalBytes / 1024).toFixed(2));
  if (criticalCssGzipKb > limitKb) {
    violations.push(
      `Critical CSS budget exceeded: ${criticalCssGzipKb} KB (Limit: ${limitKb} KB)`
    );
  }
  return criticalCssGzipKb;
}

function checkSharedJs(
  manifest: BuildManifest,
  baseDir: string,
  limits: PerformanceBudgetLimits,
  assetMetrics: AssetSizeMetric[],
  violations: string[]
): number {
  const notFoundFiles: string[] = manifest.pages?.['/_not-found/page'] || [];
  const sharedJsFiles = notFoundFiles.filter((f: string) => f.endsWith('.js') && !f.includes('_not-found'));

  let totalBytes = 0;
  for (const jsFile of sharedJsFiles) {
    const metric = inspectAssetFile(path.join('.next', jsFile), baseDir);
    if (metric) {
      totalBytes += metric.gzipBytes;
      assetMetrics.push(metric);
      if (metric.gzipKb > limits.maxSharedJsChunkKb) {
        violations.push(
          `Shared chunk ${jsFile} exceeded limit: ${metric.gzipKb} KB (Limit: ${limits.maxSharedJsChunkKb} KB)`
        );
      }
    }
  }

  const totalSharedJsGzipKb = Number((totalBytes / 1024).toFixed(2));
  if (totalSharedJsGzipKb > limits.maxJsBundleKb) {
    violations.push(
      `Shared JS bundle budget exceeded: ${totalSharedJsGzipKb} KB (Limit: ${limits.maxJsBundleKb} KB)`
    );
  }
  return totalSharedJsGzipKb;
}

function checkPageJs(
  manifest: BuildManifest,
  baseDir: string,
  limitKb: number,
  assetMetrics: AssetSizeMetric[],
  violations: string[]
): number {
  const pageFiles: string[] = manifest.pages?.['/page'] || [];
  const pageJsFiles = pageFiles.filter((f: string) => f.endsWith('.js'));

  let totalBytes = 0;
  for (const jsFile of pageJsFiles) {
    const metric = inspectAssetFile(path.join('.next', jsFile), baseDir);
    if (metric) {
      totalBytes += metric.gzipBytes;
      if (!assetMetrics.some((m) => m.filePath === metric.filePath)) {
        assetMetrics.push(metric);
      }
    }
  }

  const totalPageJsGzipKb = Number((totalBytes / 1024).toFixed(2));
  if (totalPageJsGzipKb > limitKb) {
    violations.push(
      `Total primary route JS budget exceeded: ${totalPageJsGzipKb} KB (Limit: ${limitKb} KB)`
    );
  }
  return totalPageJsGzipKb;
}

export function evaluatePerformanceBudgets(options?: {
  baseDir?: string;
  limits?: Partial<PerformanceBudgetLimits>;
  manifestOverride?: unknown;
}): PerformanceBudgetCheckResult {
  const baseDir = options?.baseDir || process.cwd();
  const limits: PerformanceBudgetLimits = {
    maxJsBundleKb: options?.limits?.maxJsBundleKb ?? PERFORMANCE_BUDGETS.MAX_JS_BUNDLE_KB,
    maxCriticalCssKb: options?.limits?.maxCriticalCssKb ?? PERFORMANCE_BUDGETS.MAX_CRITICAL_CSS_KB,
    maxSharedJsChunkKb: options?.limits?.maxSharedJsChunkKb ?? PERFORMANCE_BUDGETS.MAX_SHARED_JS_CHUNK_KB,
    maxTotalPageJsKb: options?.limits?.maxTotalPageJsKb ?? PERFORMANCE_BUDGETS.MAX_TOTAL_PAGE_JS_KB
  };

  const violations: string[] = [];
  const assetMetrics: AssetSizeMetric[] = [];
  const manifest = resolveManifest(baseDir, options?.manifestOverride);

  if (!manifest) {
    violations.push('Build manifest (.next/app-build-manifest.json) not found. Run production build first.');
    return {
      success: false,
      totalSharedJsGzipKb: 0,
      criticalCssGzipKb: 0,
      totalPageJsGzipKb: 0,
      violations,
      summary: 'Performance budget check failed: build manifest missing',
      assetMetrics
    };
  }

  const criticalCssGzipKb = checkCriticalCss(manifest, baseDir, limits.maxCriticalCssKb, assetMetrics, violations);
  const totalSharedJsGzipKb = checkSharedJs(manifest, baseDir, limits, assetMetrics, violations);
  const totalPageJsGzipKb = checkPageJs(manifest, baseDir, limits.maxTotalPageJsKb, assetMetrics, violations);

  const success = violations.length === 0;
  const summary = success
    ? `All performance budgets passed! Shared JS: ${totalSharedJsGzipKb} KB, Critical CSS: ${criticalCssGzipKb} KB, Total Page JS: ${totalPageJsGzipKb} KB.`
    : `Performance budgets violated: ${violations.join('; ')}`;

  frontendLogger.info('Performance budget evaluation completed', {
    context: {
      success,
      totalSharedJsGzipKb,
      criticalCssGzipKb,
      totalPageJsGzipKb,
      limits,
      violationsCount: violations.length
    }
  });

  return {
    success,
    totalSharedJsGzipKb,
    criticalCssGzipKb,
    totalPageJsGzipKb,
    violations,
    summary,
    assetMetrics
  };
}

export function formatBudgetReport(result: PerformanceBudgetCheckResult): string {
  const lines: string[] = [
    '====================================================',
    '       CLIENT-SIDE PERFORMANCE BUDGET REPORT        ',
    '====================================================',
    `Status: ${result.success ? 'PASSED (Clean)' : 'FAILED (Budget Exceeded)'}`,
    `Shared Client JS (gzip): ${result.totalSharedJsGzipKb} KB`,
    `Critical CSS (gzip):     ${result.criticalCssGzipKb} KB`,
    `Total Page JS (gzip):    ${result.totalPageJsGzipKb} KB`,
    '----------------------------------------------------'
  ];

  if (result.assetMetrics.length > 0) {
    lines.push('Asset Breakdown:');
    result.assetMetrics.forEach((asset) => {
      lines.push(`  - ${asset.filePath}: ${asset.gzipKb} KB gzip (${asset.rawKb} KB raw)`);
    });
    lines.push('----------------------------------------------------');
  }

  if (result.violations.length > 0) {
    lines.push('Violations:');
    result.violations.forEach((v) => lines.push(`  [FAIL] ${v}`));
  } else {
    lines.push('All assets comply with configured performance budgets.');
  }
  lines.push('====================================================');

  return lines.join('\n');
}
