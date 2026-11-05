'use client';
import React, { useEffect, useState } from 'react';
import {
  Table,
  ShieldCheck,
  Zap,
  Server,
  Lock,
  ArrowRight
} from 'lucide-react';
import { dbApiClient } from '../utils/dbApi';
import frontendLogger from '../utils/logger';
import type { DatabaseSchemaViewProps, DatabaseSchemaEntity } from '../types';
import { UI_STRINGS } from '../constants';

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [schemaEntities, setSchemaEntities] = useState<DatabaseSchemaEntity[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void dbApiClient.getDBSchema().then((entities) => {
      if (active) setSchemaEntities(entities);
    }).catch((cause: unknown) => {
      frontendLogger.error('D1 database schema load failed', { message: UI_STRINGS.databaseData.schemaLoadFailed }, cause);
      if (active) setError(UI_STRINGS.databaseData.schemaLoadFailed);
    });
    return () => { active = false; };
  }, []);
  const [queryConsoleMode, setQueryConsoleMode] = useState<'SCHEMA' | 'SAMPLE_DATA' | 'SQL_DDL'>('SCHEMA');

  const currentEntity = schemaEntities.find((e) => e.entity_name === selectedEntity) || schemaEntities[0];

  if (!currentEntity) return <p role={error ? 'alert' : 'status'}>{error || UI_STRINGS.databaseData.loadingSchema}</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-100 shadow-sm glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded border border-cyan-300">
              {UI_STRINGS.schema.bannerBadge}
            </span>
            <span className="text-xs text-slate-500">{UI_STRINGS.schema.bannerSubtitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {UI_STRINGS.schema.bannerTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {UI_STRINGS.schema.bannerDescription}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>{UI_STRINGS.schema.securityBadge}</span>
        </div>
      </div>

      {/* Schema Entities Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Entity Navigator (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
            {UI_STRINGS.schema.entitiesHeader}
          </span>
          {schemaEntities.map((entity) => (
            <button
              key={entity.entity_name}
              onClick={() => setSelectedEntity(entity.entity_name)}
              className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center justify-between ${
                selectedEntity === entity.entity_name
                  ? 'bg-cyan-50 border-cyan-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Table
                  className={`w-4 h-4 ${
                    selectedEntity === entity.entity_name ? 'text-cyan-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 block">
                    {entity.entity_name}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {entity.system_usage}
                  </span>
                </div>
              </div>
              <ArrowRight
                className={`w-3.5 h-3.5 ${
                  selectedEntity === entity.entity_name ? 'text-cyan-600' : 'text-slate-400'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Right Entity Details & Console (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold font-mono text-cyan-700">
                  {currentEntity.entity_name}
                </h3>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {UI_STRINGS.schema.tableTypeBadge}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{currentEntity.system_usage}</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setQueryConsoleMode('SCHEMA')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  queryConsoleMode === 'SCHEMA'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {UI_STRINGS.schema.tabs.attributes}
              </button>
              <button
                onClick={() => setQueryConsoleMode('SQL_DDL')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  queryConsoleMode === 'SQL_DDL'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {UI_STRINGS.schema.tabs.sqlDdl}
              </button>
              <button
                onClick={() => setQueryConsoleMode('SAMPLE_DATA')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  queryConsoleMode === 'SAMPLE_DATA'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {UI_STRINGS.schema.tabs.sampleData}
              </button>
            </div>
          </div>

          {/* View Mode: Attributes */}
          {queryConsoleMode === 'SCHEMA' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {UI_STRINGS.schema.primaryAttributesLabel}
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-cyan-800 leading-relaxed">
                {currentEntity.primary_attributes.split(',').map((attr, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-white border border-slate-200 px-2 py-1 rounded m-1 text-slate-800 shadow-xs"
                  >
                    {attr.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* View Mode: SQL DDL */}
          {queryConsoleMode === 'SQL_DDL' && (
            <div className="p-4 rounded-xl bg-white border border-slate-800 overflow-x-auto shadow-sm">
              <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
                {currentEntity.ddl}
              </pre>
            </div>
          )}

          {/* View Mode: JSON Preview */}
          {queryConsoleMode === 'SAMPLE_DATA' && (
            <div className="p-4 rounded-xl bg-white border border-slate-800 overflow-x-auto shadow-sm">
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
        <div className="p-5 rounded-2xl bg-white border border-slate-200 glass-card space-y-2">
          <div className="flex items-center space-x-2 text-cyan-600">
            <Zap className="w-5 h-5" />
            <h4 className="text-sm font-bold text-slate-900">{UI_STRINGS.schema.slaCards.performanceTitle}</h4>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <span>{UI_STRINGS.schema.slaCards.queryTelemetry}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <span>{UI_STRINGS.schema.slaCards.readCache}</span>
            </li>
          </ul>
        </div>

        {/* Security & Global Compliance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 glass-card space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600">
            <Lock className="w-5 h-5" />
            <h4 className="text-sm font-bold text-slate-900">{UI_STRINGS.schema.slaCards.securityTitle}</h4>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{UI_STRINGS.schema.slaCards.encryptionDescription}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{UI_STRINGS.schema.slaCards.complianceDescription}</span>
            </li>
          </ul>
        </div>

        {/* System Uptime & Failover */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 glass-card space-y-2">
          <div className="flex items-center space-x-2 text-purple-600">
            <Server className="w-5 h-5" />
            <h4 className="text-sm font-bold text-slate-900">{UI_STRINGS.schema.slaCards.uptimeTitle}</h4>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span>{UI_STRINGS.schema.slaCards.availabilityDescription}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <span>{UI_STRINGS.schema.slaCards.recoveryDescription}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
