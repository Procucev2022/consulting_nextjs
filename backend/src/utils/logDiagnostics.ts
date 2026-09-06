/**
 * Automated Log Diagnostics & Error Resolution Engine (Backend)
 * 
 * Continuously parses, clusters, and analyzes application logs to identify
 * root causes and generate actionable automated resolution recommendations.
 */

import fs from 'fs';
import {
  AUTO_RESOLVE_ACTIONS,
  DEFAULT_MAX_PARSE_LINES,
} from '../constants/logDiagnostics';
import {
  DiagnosticLogEntry,
  ErrorCluster,
  LogDiagnosticReport,
  AutoResolveRecommendation,
} from '../types/logDiagnostics';
import backendLogger from './logger';

export function parseLogLine(line: string): DiagnosticLogEntry | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && typeof parsed.level === 'string' && typeof parsed.message === 'string') {
      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level.toLowerCase(),
        service: parsed.service || 'unknown',
        message: parsed.message,
        requestId: parsed.requestId,
        context: parsed.context,
        error: parsed.error,
      };
    }
  } catch {
    // Non-JSON line or partial output
  }

  return null;
}

export function classifyErrorCategory(
  message: string,
  stack?: string,
  statusCode?: number
): string {
  const lowerMsg = (message + ' ' + (stack || '')).toLowerCase();

  if (statusCode === 400 || lowerMsg.includes('validation') || lowerMsg.includes('invalid input') || lowerMsg.includes('zod')) {
    return 'VALIDATION_ERROR';
  }
  if (lowerMsg.includes('prisma') || lowerMsg.includes('database') || lowerMsg.includes('query') || lowerMsg.includes('pool')) {
    return 'DATABASE_ERROR';
  }
  if (lowerMsg.includes('network') || lowerMsg.includes('econnrefused') || lowerMsg.includes('timeout') || lowerMsg.includes('econnreset')) {
    return 'NETWORK_ERROR';
  }
  if (statusCode === 401 || statusCode === 403 || lowerMsg.includes('unauthorized') || lowerMsg.includes('forbidden') || lowerMsg.includes('auth')) {
    return 'AUTH_ERROR';
  }
  if (statusCode === 500 || lowerMsg.includes('internal server error') || lowerMsg.includes('unhandled')) {
    return 'INTERNAL_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

function getRecommendationForCategory(
  category: string,
  fingerprint: string
): AutoResolveRecommendation {
  switch (category) {
    case 'VALIDATION_ERROR':
      return {
        category,
        fingerprint,
        action: AUTO_RESOLVE_ACTIONS.VALIDATE_INPUT,
        recommendation: 'Verify and align incoming request payload against Zod schema in constants/validation.ts',
        urgency: 'MEDIUM',
      };
    case 'DATABASE_ERROR':
      return {
        category,
        fingerprint,
        action: AUTO_RESOLVE_ACTIONS.CHECK_DB_CONNECTION,
        recommendation: 'Inspect connection pool capacity, Prisma query structure, and database health metrics',
        urgency: 'HIGH',
      };
    case 'NETWORK_ERROR':
      return {
        category,
        fingerprint,
        action: AUTO_RESOLVE_ACTIONS.RETRY,
        recommendation: 'Activate exponential backoff retry handler and verify remote network availability',
        urgency: 'HIGH',
      };
    case 'AUTH_ERROR':
      return {
        category,
        fingerprint,
        action: AUTO_RESOLVE_ACTIONS.CHECK_CREDENTIALS,
        recommendation: 'Verify tenant access scopes, credential expiration, and authentication headers',
        urgency: 'HIGH',
      };
    case 'INTERNAL_ERROR':
      return {
        category,
        fingerprint,
        action: AUTO_RESOLVE_ACTIONS.INVESTIGATE_UNHANDLED,
        recommendation: 'Review stack trace in logs/error.log and add defensive boundary error handlers',
        urgency: 'HIGH',
      };
    default:
      return {
        category,
        fingerprint,
        action: AUTO_RESOLVE_ACTIONS.INVESTIGATE_UNHANDLED,
        recommendation: 'Investigate raw log diagnostics and establish designated error classification',
        urgency: 'LOW',
      };
  }
}

export function analyzeLogEntries(entries: DiagnosticLogEntry[]): LogDiagnosticReport {
  let errorCount = 0;
  let warnCount = 0;
  const clusterMap = new Map<string, ErrorCluster>();

  for (const entry of entries) {
    if (entry.level === 'warn') {
      warnCount++;
    } else if (entry.level === 'error') {
      errorCount++;
    }

    if (entry.level === 'error' || entry.level === 'warn') {
      const statusCode = typeof entry.context?.statusCode === 'number'
        ? (entry.context.statusCode as number)
        : undefined;
      const category = classifyErrorCategory(entry.message, entry.error?.stack, statusCode);
      const endpoint = typeof entry.context?.path === 'string'
        ? (entry.context.path as string)
        : 'unknown';
      const fingerprint = `${category}:${entry.message.substring(0, 60)}`;

      if (!clusterMap.has(fingerprint)) {
        clusterMap.set(fingerprint, {
          category,
          fingerprint,
          count: 1,
          sampleMessage: entry.message,
          affectedEndpoints: [endpoint],
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
        });
      } else {
        const cluster = clusterMap.get(fingerprint)!;
        cluster.count++;
        cluster.lastSeen = entry.timestamp;
        if (!cluster.affectedEndpoints.includes(endpoint)) {
          cluster.affectedEndpoints.push(endpoint);
        }
      }
    }
  }

  const clusters = Array.from(clusterMap.values());
  const recommendations = clusters.map(c => getRecommendationForCategory(c.category, c.fingerprint));

  return {
    totalLinesParsed: entries.length,
    errorCount,
    warnCount,
    clusters,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

export function diagnoseLogContent(
  logContent: string,
  maxLines: number = DEFAULT_MAX_PARSE_LINES
): LogDiagnosticReport {
  const lines = logContent.split('\n').slice(-maxLines);
  const entries: DiagnosticLogEntry[] = [];

  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed) {
      entries.push(parsed);
    }
  }

  return analyzeLogEntries(entries);
}

export async function diagnoseLogFile(
  filePath: string,
  maxLines: number = DEFAULT_MAX_PARSE_LINES
): Promise<LogDiagnosticReport> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const report = diagnoseLogContent(content, maxLines);
    backendLogger.debug('Log diagnostics executed successfully', {
      filePath,
      errorsFound: report.errorCount,
      clustersCount: report.clusters.length,
    });
    return report;
  } catch (err: any) {
    backendLogger.warn('Unable to read log file for diagnosis', {
      filePath,
      reason: err.message,
    });
    return {
      totalLinesParsed: 0,
      errorCount: 0,
      warnCount: 0,
      clusters: [],
      recommendations: [],
      generatedAt: new Date().toISOString(),
    };
  }
}
