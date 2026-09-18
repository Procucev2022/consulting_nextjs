'use client';

/**
 * Enterprise Database View & Live Telemetry Section (Frontend)
 * Inspired by Enterprise_qua_nextjs infra-control and database viewer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Zap,
  RefreshCw,
  Search,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { apiClient } from '../utils/api';
import frontendLogger from '../utils/logger';
import type { DBHealthData, DBTableData } from '../types/dbView';

const AVAILABLE_TABLES = [
  { key: 'User', label: 'Users & Admins', description: 'Enterprise user authentication & credentials' },
  { key: 'TenantMaster', label: 'Tenant Master', description: 'Enterprise profile & global configuration' },
  { key: 'SpendCategorySummary', label: 'Spend Categories', description: 'High-level category spend & reduction targets' },
  { key: 'ValidationPreCheckRecord', label: 'Validation Pre-Checks', description: 'PO lines, anomaly flags & resolutions' },
  { key: 'RawDocumentIngestion', label: 'Raw Ingestions', description: 'Document upload queue & OCR telemetry' },
  { key: 'CategoryYearDetail', label: 'Category Year Details', description: '3-year category spend breakdown (FY24-FY26)' },
  { key: 'VendorYearDetail', label: 'Vendor Year Details', description: '3-year vendor spend, risk & price variance' },
  { key: 'VendorPriceRank', label: 'Vendor Volatility Ranks', description: 'Price creep percentage & leakage ranking' },
  { key: 'LineItemMapping', label: 'UNSPSC Line Mappings', description: 'AI commodity code classification & confidence' },
  { key: 'SavingsOpportunity', label: 'Savings Engine Opps', description: 'Identified savings initiatives & benchmark values' },
  { key: 'ConversionFunnelPhase', label: 'Conversion Funnel', description: 'Realization pipeline stages & conversion rates' }
];

export const DatabaseViewSection: React.FC = () => {
  // DB Health & Status State
  const [healthData, setHealthData] = useState<DBHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);

  // Table Data Explorer State
  const [selectedTable, setSelectedTable] = useState<string>('User');
  const [tableData, setTableData] = useState<DBTableData | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  // Fetch DB Health Telemetry
  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      frontendLogger.info('Fetching database health telemetry');
      const data = await apiClient.getDBStatus();
      setHealthData(data);
    } catch (err: any) {
      frontendLogger.error('Failed to fetch DB status', { error: err.message });
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  // Fetch Table Data
  const fetchTable = useCallback(async (table: string, page: number, search: string) => {
    setLoadingTable(true);
    try {
      frontendLogger.info('Fetching database table data', { table, page, search });
      const data = await apiClient.getDBTableData(table, page, 15, search);
      setTableData(data);
    } catch (err: any) {
      frontendLogger.error('Failed to fetch table data', { table, error: err.message });
    } finally {
      setLoadingTable(false);
    }
  }, []);

  // Initial Load & Polling
  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    void fetchTable(selectedTable, currentPage, searchQuery);
  }, [selectedTable, currentPage, searchQuery, fetchTable]);

  // Handle Ping Test
  const handleTestPing = async () => {
    setPinging(true);
    setPingMessage(null);
    try {
      const res = await apiClient.testDBConnection();
      if (res.success) {
        setPingMessage(`⚡ Connected (${res.latencyMs}ms round-trip)`);
        void fetchHealth();
      } else {
        setPingMessage(`⚠️ Ping failed: ${res.message}`);
      }
    } catch (err: any) {
      setPingMessage(`⚠️ Ping error: ${err.message}`);
    } finally {
      setPinging(false);
      setTimeout(() => setPingMessage(null), 5000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. TOP TELEMETRY CARD */}
      <div style={{
        backgroundColor: '#0c1424',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: healthData?.isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${healthData?.isConnected ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database style={{ width: '26px', height: '26px', color: healthData?.isConnected ? '#4ade80' : '#f87171' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                  PostgreSQL Live Database
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: healthData?.isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: healthData?.isConnected ? '#4ade80' : '#f87171',
                  border: `1px solid ${healthData?.isConnected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: healthData?.isConnected ? '#4ade80' : '#f87171'
                  }} />
                  {healthData?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Prisma ORM • Managed Neon Cloud Host • SSL Enforced
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleTestPing}
              disabled={pinging}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: pinging ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Zap style={{ width: '15px', height: '15px' }} />
              {pinging ? 'Testing Ping...' : 'Test Connection'}
            </button>
            <button
              type="button"
              onClick={() => { void fetchHealth(); void fetchTable(selectedTable, currentPage, searchQuery); }}
              disabled={loadingHealth || loadingTable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw style={{ width: '15px', height: '15px', animation: (loadingHealth || loadingTable) ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {pingMessage && (
          <div style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: pingMessage.includes('⚡') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${pingMessage.includes('⚡') ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: pingMessage.includes('⚡') ? '#86efac' : '#fca5a5',
            fontSize: '13px',
            fontWeight: 500
          }}>
            {pingMessage}
          </div>
        )}

        {/* Telemetry Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(148, 163, 184, 0.12)'
        }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latency</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
              {healthData?.latencyMs ? `${healthData.latencyMs} ms` : '—'}
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tables</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7', marginTop: '2px' }}>
              {healthData?.tablesCount || 11}
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Live Records</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e', marginTop: '2px' }}>
              {healthData?.totalRecords ?? 0}
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Name</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {healthData?.databaseName || 'consulting_db_dev'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABLE SELECTOR CARDS */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>
          Select Database Table to Inspect
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px'
        }}>
          {AVAILABLE_TABLES.map((t) => {
            const isSelected = selectedTable === t.key;
            // Record count key
            const countKeyMap: Record<string, keyof typeof healthData.recordCounts> = {
              User: 'users',
              TenantMaster: 'tenants',
              SpendCategorySummary: 'spendCategories',
              ValidationPreCheckRecord: 'validationRecords',
              RawDocumentIngestion: 'rawDocuments',
              CategoryYearDetail: 'categoryYearDetails',
              VendorYearDetail: 'vendorYearDetails',
              VendorPriceRank: 'vendorPriceRanks',
              LineItemMapping: 'lineItemMappings',
              SavingsOpportunity: 'savingsOpportunities',
              ConversionFunnelPhase: 'conversionFunnelPhases'
            };
            const countKey = countKeyMap[t.key];
            const count = (healthData?.recordCounts && countKey) ? healthData.recordCounts[countKey] : 0;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { setSelectedTable(t.key); setCurrentPage(1); }}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#0b1322',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                    {t.label}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: count > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: count > 0 ? '#4ade80' : '#94a3b8'
                  }}>
                    {count} {count === 1 ? 'row' : 'rows'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. INTERACTIVE LIVE TABLE EXPLORER */}
      <div style={{
        backgroundColor: '#0b1322',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Table Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '18px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
              Table: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{tableData?.tableName || selectedTable}</span>
            </h3>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Showing {tableData?.rows?.length ?? 0} of {tableData?.total ?? 0} live database records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#64748b'
              }} />
              <input
                type="text"
                placeholder={`Search ${selectedTable}...`}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 36px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Data View */}
        {loadingTable ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#38bdf8' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Loading live records from PostgreSQL...</p>
          </div>
        ) : !tableData?.rows || tableData.rows.length === 0 ? (
          <div style={{
            padding: '50px 20px',
            textAlign: 'center',
            backgroundColor: '#070b14',
            borderRadius: '12px',
            border: '1px dashed rgba(148, 163, 184, 0.2)'
          }}>
            <Database style={{ width: '36px', height: '36px', color: '#64748b', margin: '0 auto 10px' }} />
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>No records found in {selectedTable}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              {searchQuery ? 'Try clearing the search query' : 'This table has 0 rows in the active PostgreSQL database'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#070c18', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, width: '40px' }}>#</th>
                  {tableData.columns.map((col) => (
                    <th key={col} style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}>
                      {col}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr
                    key={String(row.id || row.doc_id || row.record_id || row.opp_id || idx)}
                    style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {(currentPage - 1) * tableData.limit + idx + 1}
                    </td>
                    {tableData.columns.map((col) => {
                      const val = row[col];
                      let displayVal = '—';
                      if (val !== null && val !== undefined) {
                        if (typeof val === 'object') {
                          displayVal = JSON.stringify(val);
                        } else if (typeof val === 'boolean') {
                          displayVal = val ? 'true' : 'false';
                        } else {
                          displayVal = String(val);
                        }
                      }
                      return (
                        <td
                          key={col}
                          style={{
                            padding: '12px 16px',
                            color: col === 'id' || col.endsWith('_id') ? '#38bdf8' : '#e2e8f0',
                            fontFamily: col === 'id' || col.endsWith('_id') || col.includes('hash') ? 'monospace' : 'inherit',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '')}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(row)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye style={{ width: '13px', height: '13px' }} />
                        JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {tableData && tableData.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            marginTop: '16px',
            borderTop: '1px solid rgba(148, 163, 184, 0.12)'
          }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Page {tableData.page} of {tableData.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: currentPage <= 1 ? '#64748b' : '#e2e8f0',
                  fontSize: '13px',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft style={{ width: '14px', height: '14px' }} />
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= tableData.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(tableData.totalPages, p + 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: currentPage >= tableData.totalPages ? '#64748b' : '#e2e8f0',
                  fontSize: '13px',
                  cursor: currentPage >= tableData.totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. JSON RECORD INSPECTOR MODAL */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0c1424',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Record Inspector: {selectedTable}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <pre style={{
                margin: 0,
                backgroundColor: '#060a12',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                color: '#4ade80',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>

            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(148, 163, 184, 0.15)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#38bdf8',
                  border: 'none',
                  color: '#070b14',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
