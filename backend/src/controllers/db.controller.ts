/**
 * Database View & Telemetry Controller (Backend)
 * Inspired by Enterprise_qua_nextjs database status & telemetry architecture
 */

import type { Request, Response } from 'express';
import { prisma } from '../services/db';
import { queryAuditor } from '../utils/queryAuditor';
import { queryCache } from '../utils/queryCache';
import logger from '../utils/logger';

interface DBRecordCounts {
  users: number;
  tenants: number;
  rawDocuments: number;
  validationRecords: number;
  spendCategories: number;
  categoryYearDetails: number;
  vendorYearDetails: number;
  vendorPriceRanks: number;
  lineItemMappings: number;
  savingsOpportunities: number;
  conversionFunnelPhases: number;
}

interface ConnectionInfo {
  isConnected: boolean;
  latencyMs: number;
  databaseName: string;
  host: string;
  sslEnabled: boolean;
  errorMessage: string | null;
}

const TABLE_FIELD_MAP: Record<string, string[]> = {
  User: ['name', 'email', 'company_name'],
  TenantMaster: ['enterprise_name', 'tenant_id'],
  RawDocumentIngestion: ['file_name', 'tenant_id'],
  ValidationPreCheckRecord: ['vendor_name', 'po_number', 'raw_desc'],
  SpendCategorySummary: ['name', 'id'],
  CategoryYearDetail: ['category', 'id'],
  VendorYearDetail: ['vendor_name', 'id'],
  VendorPriceRank: ['vendor_name', 'category'],
  LineItemMapping: ['raw_line_text', 'vendor_identified'],
  SavingsOpportunity: ['category', 'opp_id'],
  ConversionFunnelPhase: ['stage', 'title']
};

export class DBController {
  private async checkConnection(): Promise<ConnectionInfo> {
    let isConnected = false;
    let latencyMs = 0;
    let databaseName = 'consulting_db_dev';
    let host = 'PostgreSQL';
    let sslEnabled = true;
    let errorMessage: string | null = null;

    try {
      const pingStart = Date.now();
      await prisma.$queryRawUnsafe('SELECT 1 as ping');
      latencyMs = Date.now() - pingStart;
      isConnected = true;

      const dbUrl = process.env.DATABASE_URL || '';
      if (dbUrl) {
        const match = dbUrl.match(/@([^/:]+)(?::(\d+))?\/([^?]+)/);
        if (match) {
          host = match[1] || host;
          databaseName = match[3] || databaseName;
        }
        sslEnabled = dbUrl.includes('sslmode=') || dbUrl.includes('ssl=') || host.includes('neon.tech');
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      isConnected = false;
      errorMessage = errorObj.message || 'Unable to reach PostgreSQL instance';
    }

    return { isConnected, latencyMs, databaseName, host, sslEnabled, errorMessage };
  }

  private async fetchRecordCounts(isConnected: boolean): Promise<DBRecordCounts> {
    const emptyCounts: DBRecordCounts = {
      users: 0,
      tenants: 0,
      rawDocuments: 0,
      validationRecords: 0,
      spendCategories: 0,
      categoryYearDetails: 0,
      vendorYearDetails: 0,
      vendorPriceRanks: 0,
      lineItemMappings: 0,
      savingsOpportunities: 0,
      conversionFunnelPhases: 0
    };

    if (!isConnected) {
      return emptyCounts;
    }

    try {
      const [
        users,
        tenants,
        rawDocs,
        valRecords,
        spendCats,
        catDetails,
        venDetails,
        venRanks,
        lineItems,
        savings,
        funnel
      ] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.tenantMaster.count().catch(() => 0),
        prisma.rawDocumentIngestion.count().catch(() => 0),
        prisma.validationPreCheckRecord.count().catch(() => 0),
        prisma.spendCategorySummary.count().catch(() => 0),
        prisma.categoryYearDetail.count().catch(() => 0),
        prisma.vendorYearDetail.count().catch(() => 0),
        prisma.vendorPriceRank.count().catch(() => 0),
        prisma.lineItemMapping.count().catch(() => 0),
        prisma.savingsOpportunity.count().catch(() => 0),
        prisma.conversionFunnelPhase.count().catch(() => 0)
      ]);

      return {
        users,
        tenants,
        rawDocuments: rawDocs,
        validationRecords: valRecords,
        spendCategories: spendCats,
        categoryYearDetails: catDetails,
        vendorYearDetails: venDetails,
        vendorPriceRanks: venRanks,
        lineItemMappings: lineItems,
        savingsOpportunities: savings,
        conversionFunnelPhases: funnel
      };
    } catch (countErr: unknown) {
      const errorObj = countErr as Error;
      logger.warn('Failed to fetch some table counts', { error: errorObj.message });
      return emptyCounts;
    }
  }

  /**
   * GET /api/db/status
   * Reports live PostgreSQL connection health, latency, provider info, and model record counts.
   */
  public async getDBStatus(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;

    const conn = await this.checkConnection();
    if (!conn.isConnected) {
      logger.warn('Database health check failed', { error: conn.errorMessage, requestId });
    }

    const recordCounts = await this.fetchRecordCounts(conn.isConnected);

    logger.info('Database status telemetry generated', {
      isConnected: conn.isConnected,
      latencyMs: conn.latencyMs,
      durationMs: Date.now() - start,
      requestId
    });

    res.json({
      success: true,
      data: {
        isConnected: conn.isConnected,
        provider: 'PostgreSQL (Prisma ORM)',
        host: conn.host,
        databaseName: conn.databaseName,
        sslEnabled: conn.sslEnabled,
        latencyMs: conn.latencyMs,
        errorMessage: conn.errorMessage,
        serverTime: new Date().toISOString(),
        tablesCount: 11,
        totalRecords: Object.values(recordCounts).reduce((a, b) => a + b, 0),
        recordCounts,
        cacheSize: queryCache.getCacheSize()
      }
    });
  }

  /**
   * GET /api/db/metrics
   * Query performance, auditor logs, and cache efficiency metrics
   */
  public async getDBMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = queryAuditor.getQueryMetrics();
      const cacheSize = queryCache.getCacheSize();

      res.json({
        success: true,
        data: {
          metrics,
          cacheSize
        }
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error('Error fetching DB metrics', { error: errorObj.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve database metrics' });
    }
  }

  private async fetchTableRows(
    tableName: string,
    search: string,
    skip: number,
    take: number
  ): Promise<{ total: number; rows: Record<string, unknown>[] }> {
    const delegateMap = prisma as unknown as Record<string, {
      count: (args: unknown) => Promise<number>;
      findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
    }>;
    const delegateName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    const model = delegateMap[delegateName];
    const searchFields = TABLE_FIELD_MAP[tableName] || [];

    const where = (search.trim() && searchFields.length > 0)
      ? {
          OR: searchFields.map((field) => ({
            [field]: { contains: search.trim(), mode: 'insensitive' }
          }))
        }
      : {};

    let total = 0;
    let rows: Record<string, unknown>[] = [];

    if (model && typeof model.findMany === 'function') {
      try {
        [total, rows] = await Promise.all([
          model.count({ where }),
          model.findMany({ where, skip, take })
        ]);
      } catch (findErr: unknown) {
        const errorObj = findErr as Error;
        logger.warn('Model findMany failed, falling back to raw query', { error: errorObj.message });
      }
    }

    if (rows.length === 0) {
      try {
        const rawRows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT * FROM "${tableName}" LIMIT ${take} OFFSET ${skip}`
        );
        const countRes = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT COUNT(*)::int as count FROM "${tableName}"`
        );
        total = countRes?.[0]?.count || rawRows.length;
        rows = rawRows;
      } catch (rawErr: unknown) {
        const errorObj = rawErr as Error;
        logger.warn('Raw SQL query failed', { table: tableName, error: errorObj.message });
      }
    }

    return { total, rows };
  }

  /**
   * GET /api/db/tables
   * Live table rows inspector with pagination & search
   */
  public async getTableData(req: Request, res: Response): Promise<void> {
    const { table, page = '1', limit = '20', search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const tableName = (table as string || 'User').trim();

    if (!TABLE_FIELD_MAP[tableName]) {
      res.status(400).json({
        success: false,
        message: `Invalid table name: ${tableName}. Available tables: ${Object.keys(TABLE_FIELD_MAP).join(', ')}`
      });
      return;
    }

    try {
      const searchStr = typeof search === 'string' ? search : '';
      const { total, rows } = await this.fetchTableRows(tableName, searchStr, skip, take);

      const sanitizedRows = tableName === 'User'
        ? rows.map((r) => {
            const copy = { ...r };
            delete copy.password_hash;
            return { ...copy, password_hash: '[PROTECTED_HASH]' };
          })
        : rows;

      const columns = sanitizedRows.length > 0 ? Object.keys(sanitizedRows[0]) : [];

      res.json({
        success: true,
        data: {
          tableName,
          page: pageNum,
          limit: take,
          total,
          totalPages: Math.ceil(total / take) || 1,
          columns,
          rows: sanitizedRows
        }
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error('Error fetching table data', { table: tableName, error: errorObj.message });
      res.status(500).json({
        success: false,
        message: `Failed to fetch data from table ${tableName}: ${errorObj.message}`
      });
    }
  }

  /**
   * POST /api/db/test-connection
   * Live round-trip ping
   */
  public async testConnection(_req: Request, res: Response): Promise<void> {
    try {
      const pingStart = Date.now();
      await prisma.$queryRawUnsafe('SELECT 1 as ping');
      const latencyMs = Date.now() - pingStart;

      res.json({
        success: true,
        message: `PostgreSQL connection verified successfully in ${latencyMs}ms`,
        latencyMs,
        timestamp: new Date().toISOString()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      res.status(503).json({
        success: false,
        message: `Database ping failed: ${errorObj.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const dbController = new DBController();
