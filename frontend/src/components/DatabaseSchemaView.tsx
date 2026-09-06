'use client';
import React, { useState } from 'react';
import {
  Table,
  ShieldCheck,
  Zap,
  Server,
  Lock,
  ArrowRight
} from 'lucide-react';
import { schemaEntities } from '../data/mockData';
import type { DatabaseSchemaViewProps } from '../types';
import { UI_STRINGS } from '../constants';

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('Tenant_Master');
  const [queryConsoleMode, setQueryConsoleMode] = useState<'SCHEMA' | 'SAMPLE_DATA' | 'SQL_DDL'>('SCHEMA');

  const currentEntity = schemaEntities.find((e) => e.entity_name === selectedEntity) || schemaEntities[0];

  const getDdlForEntity = (entityName: string): string => {
    switch (entityName) {
      case 'Tenant_Master':
        return `CREATE TABLE Tenant_Master (
    tenant_id VARCHAR(64) PRIMARY KEY,
    enterprise_name VARCHAR(255) NOT NULL,
    region VARCHAR(32) NOT NULL CHECK (region IN ('NA', 'EU', 'APAC', 'GLOBAL')),
    base_currency VARCHAR(8) DEFAULT 'USD',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tenant_status ON Tenant_Master(status);`;
      case 'Raw_Document_Ingestion':
        return `CREATE TABLE Raw_Document_Ingestion (
    doc_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES Tenant_Master(tenant_id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(16) NOT NULL,
    file_size_mb NUMERIC(10, 2),
    ocr_status VARCHAR(32) DEFAULT 'Pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ingestion_tenant ON Raw_Document_Ingestion(tenant_id, uploaded_at);`;
      case 'Spend_Line_Items':
        return `CREATE TABLE Spend_Line_Items (
    line_item_id VARCHAR(64) PRIMARY KEY,
    doc_id VARCHAR(64) REFERENCES Raw_Document_Ingestion(doc_id),
    tenant_id VARCHAR(64) REFERENCES Tenant_Master(tenant_id),
    po_number VARCHAR(128),
    invoice_date DATE NOT NULL,
    vendor_id VARCHAR(64),
    raw_desc TEXT NOT NULL,
    unit_price NUMERIC(14, 4),
    qty NUMERIC(14, 4),
    total_spend NUMERIC(16, 2) NOT NULL
);
CREATE INDEX idx_spend_items ON Spend_Line_Items(tenant_id, po_number, invoice_date);`;
      case 'AI_Taxonomy_Mapping':
        return `CREATE TABLE AI_Taxonomy_Mapping (
    mapping_id VARCHAR(64) PRIMARY KEY,
    line_item_id VARCHAR(64) REFERENCES Spend_Line_Items(line_item_id),
    unspsc_code VARCHAR(16) NOT NULL,
    core_category VARCHAR(64) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    verified_by_user BOOLEAN DEFAULT FALSE,
    mapped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_taxonomy_unspsc ON AI_Taxonomy_Mapping(unspsc_code, core_category);`;
      case 'Market_Indices':
        return `CREATE TABLE Market_Indices (
    index_id VARCHAR(64) PRIMARY KEY,
    index_code VARCHAR(32) NOT NULL,
    commodity_name VARCHAR(128) NOT NULL,
    price_date DATE NOT NULL,
    benchmark_value NUMERIC(14, 4) NOT NULL
);
CREATE INDEX idx_commodity_date ON Market_Indices(index_code, price_date);`;
      case 'Savings_Opportunities':
        return `CREATE TABLE Savings_Opportunities (
    opp_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES Tenant_Master(tenant_id),
    category VARCHAR(64) NOT NULL,
    current_spend NUMERIC(16, 2) NOT NULL,
    target_savings_pct NUMERIC(5, 2) NOT NULL,
    savings_usd NUMERIC(16, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Identified',
    pushed_to_module VARCHAR(32) CHECK (pushed_to_module IN ('proCPX', 'DPS NXT', NULL)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_savings_status ON Savings_Opportunities(tenant_id, status);`;
      default:
        return '-- DDL Schema Definition';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/40 border border-sky-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              {UI_STRINGS.schema.bannerBadge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.schema.bannerSubtitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.schema.bannerTitle}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.schema.bannerDescription}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/50 shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>{UI_STRINGS.schema.securityBadge}</span>
        </div>
      </div>

      {/* Schema Entities Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Entity Navigator (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block px-1">
            {UI_STRINGS.schema.entitiesHeader}
          </span>
          {schemaEntities.map((entity) => (
            <button
              key={entity.entity_name}
              onClick={() => setSelectedEntity(entity.entity_name)}
              className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center justify-between ${
                selectedEntity === entity.entity_name
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 shadow-sm dark:shadow-cyan-500/15'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Table
                  className={`w-4 h-4 ${
                    selectedEntity === entity.entity_name ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                    {entity.entity_name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {entity.system_usage}
                  </span>
                </div>
              </div>
              <ArrowRight
                className={`w-3.5 h-3.5 ${
                  selectedEntity === entity.entity_name ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Right Entity Details & Console (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold font-mono text-cyan-700 dark:text-cyan-400">
                  {currentEntity.entity_name}
                </h3>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {UI_STRINGS.schema.tableTypeBadge}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{currentEntity.system_usage}</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setQueryConsoleMode('SCHEMA')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  queryConsoleMode === 'SCHEMA'
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {UI_STRINGS.schema.tabs.attributes}
              </button>
              <button
                onClick={() => setQueryConsoleMode('SQL_DDL')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  queryConsoleMode === 'SQL_DDL'
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {UI_STRINGS.schema.tabs.sqlDdl}
              </button>
              <button
                onClick={() => setQueryConsoleMode('SAMPLE_DATA')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  queryConsoleMode === 'SAMPLE_DATA'
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {UI_STRINGS.schema.tabs.sampleData}
              </button>
            </div>
          </div>

          {/* View Mode: Attributes */}
          {queryConsoleMode === 'SCHEMA' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {UI_STRINGS.schema.primaryAttributesLabel}
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-cyan-800 dark:text-cyan-300 leading-relaxed">
                {currentEntity.primary_attributes.split(',').map((attr, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded m-1 text-slate-800 dark:text-slate-200 shadow-xs"
                  >
                    {attr.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* View Mode: SQL DDL */}
          {queryConsoleMode === 'SQL_DDL' && (
            <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-800 overflow-x-auto shadow-sm">
              <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
                {getDdlForEntity(currentEntity.entity_name)}
              </pre>
            </div>
          )}

          {/* View Mode: JSON Preview */}
          {queryConsoleMode === 'SAMPLE_DATA' && (
            <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-800 overflow-x-auto shadow-sm">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(currentEntity.sample_records, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Section 6: Non-Functional Requirements & Security Standards Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Performance SLA */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-2">
          <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400">
            <Zap className="w-5 h-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{UI_STRINGS.schema.slaCards.performanceTitle}</h4>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <span><strong>Sub-second (&lt;800ms)</strong> query rendering speed over multi-million record datasets.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <span>Document ETL processing speed <strong>under 15 minutes</strong> for 2GB multi-year batch uploads.</span>
            </li>
          </ul>
        </div>

        {/* Security & Global Compliance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{UI_STRINGS.schema.slaCards.securityTitle}</h4>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>End-to-end encryption (<strong>AES-256</strong> at rest, <strong>TLS 1.3</strong> in transit).</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>SOC2 Type II</strong> audit readiness, MFA, RBAC, GDPR, NA, EU, and APAC trade compliance.</span>
            </li>
          </ul>
        </div>

        {/* System Uptime & Failover */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-2">
          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
            <Server className="w-5 h-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{UI_STRINGS.schema.slaCards.uptimeTitle}</h4>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span><strong>99.95%</strong> platform availability SLA with multi-region active-passive failover.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span>Daily automated data backups and automated instant disaster recovery.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
