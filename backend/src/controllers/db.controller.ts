/**
 * Database View & Telemetry Controller (Backend)
 * Inspired by Enterprise_qua_nextjs database status & telemetry architecture
 */

import type { Request, Response } from 'express';
import { prisma, db } from '../services/db';
import { queryAuditor } from '../utils/queryAuditor';
import { queryCache } from '../utils/queryCache';
import logger from '../utils/logger';

export class DBController {
  /**
   * GET /api/db/status
   * Reports live PostgreSQL connection health, latency, provider info, and model record counts.
   */
  public async getDBStatus(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] as string | undefined;

    let isConnected = false;
    let latencyMs = 0;
    let databaseName = 'consulting_db_dev';
    let host = 'PostgreSQL';
    let sslEnabled = true;
    let errorMessage: string | null = null;

    // Test live connection & measure latency
    try {
      const pingStart = Date.now();
      await (prisma as any).$queryRawUnsafe('SELECT 1 as ping');
      latencyMs = Date.now() - pingStart;
      isConnected = true;

      // Extract DB URL metadata safely without exposing password
      const dbUrl = process.env.DATABASE_URL || '';
      if (dbUrl) {
        try {
          const match = dbUrl.match(/@([^/:]+)(?::(\d+))?\/([^?]+)/);
          if (match) {
            host = match[1] || host;
            databaseName = match[3] || databaseName;
          }
          sslEnabled = dbUrl.includes('sslmode=') || dbUrl.includes('ssl=') || host.includes('neon.tech') || host.includes('aws');
        } catch {
          // fallback default
        }
      }
    } catch (err: any) {
      isConnected = false;
      errorMessage = err.message || 'Unable to reach PostgreSQL instance';
      logger.warn('Database health check failed', { error: errorMessage, requestId });
    }

    // Retrieve live record counts across models
    let recordCounts = {
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

    if (isConnected) {
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
          (prisma as any).user.count().catch(() => 0),
          (prisma as any).tenantMaster.count().catch(() => 0),
          (prisma as any).rawDocumentIngestion.count().catch(() => 0),
          (prisma as any).validationPreCheckRecord.count().catch(() => 0),
          (prisma as any).spendCategorySummary.count().catch(() => 0),
          (prisma as any).categoryYearDetail.count().catch(() => 0),
          (prisma as any).vendorYearDetail.count().catch(() => 0),
          (prisma as any).vendorPriceRank.count().catch(() => 0),
          (prisma as any).lineItemMapping.count().catch(() => 0),
          (prisma as any).savingsOpportunity.count().catch(() => 0),
          (prisma as any).conversionFunnelPhase.count().catch(() => 0)
        ]);

        recordCounts = {
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
      } catch (countErr: any) {
        logger.warn('Failed to fetch some table counts', { error: countErr.message });
      }
    }

    logger.info('Database status telemetry generated', {
      isConnected,
      latencyMs,
      durationMs: Date.now() - start,
      requestId
    });

    res.json({
      success: true,
      data: {
        isConnected,
        provider: 'PostgreSQL (Prisma ORM)',
        host,
        databaseName,
        sslEnabled,
        latencyMs,
        errorMessage,
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
  public async getDBMetrics(req: Request, res: Response): Promise<void> {
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
    } catch (err: any) {
      logger.error('Error fetching DB metrics', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve database metrics' });
    }
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

    // Map allowed tables
    const tableFieldMap: Record<string, string[]> = {
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

    if (!tableFieldMap[tableName]) {
      res.status(400).json({
        success: false,
        message: `Invalid table name: ${tableName}. Available tables: ${Object.keys(tableFieldMap).join(', ')}`
      });
      return;
    }

    const searchFields = tableFieldMap[tableName];
    const delegateName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    const model = (prisma as any)[delegateName];

    try {
      let where: any = {};
      if (search && typeof search === 'string' && search.trim() && searchFields.length) {
        const q = search.trim();
        where.OR = searchFields.map((field) => ({
          [field]: { contains: q, mode: 'insensitive' }
        }));
      }

      let total = 0;
      let rows: any[] = [];

      if (model && typeof model.findMany === 'function') {
        try {
          [total, rows] = await Promise.all([
            model.count({ where }),
            model.findMany({
              where,
              skip,
              take
            })
          ]);
        } catch (findErr: any) {
          logger.warn('Model findMany failed, falling back to raw query', { error: findErr.message });
        }
      }

      if (rows.length === 0) {
        try {
          const rawRows = await (prisma as any).$queryRawUnsafe(`SELECT * FROM "${tableName}" LIMIT ${take} OFFSET ${skip}`);
          const countRes = await (prisma as any).$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
          total = countRes?.[0]?.count || rawRows.length;
          rows = rawRows;
        } catch (rawErr: any) {
          logger.warn('Raw SQL query failed', { table: tableName, error: rawErr.message });
        }
      }

      // Sanitize user sensitive fields if inspecting User table
      const sanitizedRows = tableName === 'User' 
        ? rows.map((r: any) => {
            const { password_hash, ...rest } = r;
            return { ...rest, password_hash: '[PROTECTED_HASH]' };
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
    } catch (err: any) {
      logger.error('Error fetching table data', { table: tableName, error: err.message });
      res.status(500).json({
        success: false,
        message: `Failed to fetch data from table ${tableName}: ${err.message}`
      });
    }
  }

  /**
   * POST /api/db/test-connection
   * Live round-trip ping
   */
  public async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const pingStart = Date.now();
      await (prisma as any).$queryRawUnsafe('SELECT 1 as ping');
      const latencyMs = Date.now() - pingStart;

      res.json({
        success: true,
        message: `PostgreSQL connection verified successfully in ${latencyMs}ms`,
        latencyMs,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        success: false,
        message: `Database ping failed: ${err.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const dbController = new DBController();
