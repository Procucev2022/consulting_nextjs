'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomerManagementViewProps, CustomerRecord, AssessmentRecord } from '../../types';
import { UI_STRINGS } from '../../constants';
import { assessmentApiClient } from '../../utils/assessmentApi';
import frontendLogger from '../../utils/logger';
import { CreateCustomerModal } from './CreateCustomerModal';
import { EditCustomerModal } from './EditCustomerModal';

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  onSelectCustomer,
  onCreateAssessmentForCustomer,
  onOpenAssessmentInModule1,
  selectedCustomerId
}) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);

  const fetchRequestIdRef = useRef<number>(0);
  const selectedCustomerIdRef = useRef<string | undefined>(selectedCustomerId);
  selectedCustomerIdRef.current = selectedCustomerId;

  const loadData = useCallback(async (): Promise<void> => {
    const requestId = ++fetchRequestIdRef.current;
    try {
      setIsLoading(true);
      const [custList, assessList] = await Promise.all([
        assessmentApiClient.getCustomers(),
        assessmentApiClient.getAssessments()
      ]);

      if (requestId !== fetchRequestIdRef.current) return;

      setCustomers(custList);
      setAssessments(assessList);

      const targetId = selectedCustomerIdRef.current;
      if (targetId) {
        const found = custList.find((c) => c.id === targetId);
        if (found) {
          setSelectedCustomer(found);
        }
      }
    } catch (err: unknown) {
      if (requestId !== fetchRequestIdRef.current) return;
      frontendLogger.error('Failed to load customers and assessments', {
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Keep selectedCustomer in sync with selectedCustomerId prop
  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const match = customers.find((c) => c.id === selectedCustomerId);
      if (match) {
        setSelectedCustomer(match);
      }
    }
  }, [selectedCustomerId, customers]);

  const handleSelectCustomer = (customer: CustomerRecord): void => {
    setSelectedCustomer(customer);
    onSelectCustomer(customer);
    frontendLogger.info('Selected customer in Command Centre', { customerId: customer.id, name: customer.customerName });
  };

  const handleClearSelection = (): void => {
    setSelectedCustomer(null);
    frontendLogger.info('Cleared customer selection in Command Centre');
  };

  const handleCustomerCreated = (newCust: CustomerRecord): void => {
    setCustomers((prev) => [newCust, ...prev]);
    setSelectedCustomer(newCust);
    onSelectCustomer(newCust);
  };

  const handleCustomerUpdated = (updatedCust: CustomerRecord): void => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    if (selectedCustomer?.id === updatedCust.id) {
      setSelectedCustomer(updatedCust);
    }
  };

  const strings = UI_STRINGS.ASSESSMENT.customerManagement;

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      Boolean(c.businessUnit?.toLowerCase().includes(q)) ||
      Boolean(c.region?.toLowerCase().includes(q))
    );
  });

  const selectedCustomerAssessments = selectedCustomer
    ? assessments.filter((a) => a.customerId === selectedCustomer.id || a.customerName === selectedCustomer.customerName)
    : [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{strings.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{strings.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/40"
          >
            {strings.btnCreateCustomer}
          </button>
        </div>
      </div>

      {/* Selected Customer Spotlight Banner */}
      {selectedCustomer ? (
        <div className="p-4 rounded-xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                ACTIVE CUSTOMER
              </span>
              <span className="text-xs font-mono text-slate-400">{selectedCustomer.id}</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">{selectedCustomer.customerName}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Industry: <strong className="text-slate-200">{selectedCustomer.industry}</strong></span>
              {selectedCustomer.companyWebsite && (
                <span>Website: <strong className="text-cyan-400">{selectedCustomer.companyWebsite}</strong></span>
              )}
              {selectedCustomer.businessUnit && (
                <span>BU: <strong className="text-slate-200">{selectedCustomer.businessUnit}</strong></span>
              )}
              <span>Region: <strong className="text-slate-200">{selectedCustomer.region}</strong></span>
              <span>Currency: <strong className="text-slate-200">{selectedCustomer.baseCurrency}</strong></span>
              {selectedCustomer.contactPerson && (
                <span>Contact: <strong className="text-slate-200">{selectedCustomer.contactPerson}</strong></span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingCustomer(selectedCustomer);
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {strings.btnEditCustomer}
            </button>
            <button
              type="button"
              onClick={() => onCreateAssessmentForCustomer(selectedCustomer)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
            >
              {strings.btnCreateAssessment}
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              {strings.clearSelection}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400 flex items-center justify-between">
          <span>{strings.emptyNoSelection}</span>
          <span className="text-[11px] text-slate-500">Select a customer below to proceed</span>
        </div>
      )}

      {/* Selected Customer Assessments Dossier Section */}
      {selectedCustomer && (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                Assessments for {selectedCustomer.customerName}
              </h4>
              <p className="text-xs text-slate-400">
                {selectedCustomerAssessments.length} assessment record(s) linked to this customer profile
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateAssessmentForCustomer(selectedCustomer)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
            >
              + Create Assessment
            </button>
          </div>

          {selectedCustomerAssessments.length === 0 ? (
            <div className="p-6 rounded-lg border border-dashed border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">No assessments created yet for {selectedCustomer.customerName}.</p>
              <button
                type="button"
                onClick={() => onCreateAssessmentForCustomer(selectedCustomer)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
              >
                Create first assessment →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Assessment ID</th>
                    <th className="py-2.5 px-3">Assessment Period</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Data Status</th>
                    <th className="py-2.5 px-3">Data Version</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedCustomerAssessments.map((a) => (
                    <tr key={a.assessmentId || a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">{a.assessmentId || a.id}</td>
                      <td className="py-2.5 px-3">{a.assessmentPeriod || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{a.dataStatus || 'AWAITING_DATA'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{a.currentDataVersionId || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        {onOpenAssessmentInModule1 && (
                          <button
                            type="button"
                            onClick={() => onOpenAssessmentInModule1(a)}
                            className="px-2.5 py-1 rounded bg-cyan-700/80 hover:bg-cyan-600 text-white font-semibold text-[11px] transition-colors"
                          >
                            Open Module 1 →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Directory Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">{strings.tabCustomers}</h3>
            <p className="text-xs text-slate-400">Directory of registered enterprise customers</p>
          </div>
          <div className="w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={strings.searchPlaceholder}
              className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading customer profiles...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-3 bg-slate-900/40">
            <p className="text-xs text-slate-400">{strings.emptyNoCustomers}</p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
            >
              {strings.btnCreateCustomer}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/60 border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">{strings.table.colId}</th>
                    <th className="py-3 px-4">{strings.table.colName}</th>
                    <th className="py-3 px-4">{strings.table.colIndustry}</th>
                    <th className="py-3 px-4">{strings.table.colBusinessUnit}</th>
                    <th className="py-3 px-4">{strings.table.colRegion}</th>
                    <th className="py-3 px-4">{strings.table.colAssessmentsCount}</th>
                    <th className="py-3 px-4 text-right">{strings.table.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredCustomers.map((cust) => {
                    const custAssessments = assessments.filter(
                      (a) => a.customerId === cust.id || a.customerName === cust.customerName
                    );
                    const isSelected = selectedCustomer?.id === cust.id;

                    return (
                      <tr
                        key={cust.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-cyan-950/30 font-medium' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-cyan-400">{cust.id}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{cust.customerName}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400">
                                SELECTED
                              </span>
                            )}
                          </div>
                          {cust.companyWebsite && (
                            <div className="text-[10px] text-cyan-400/80 font-normal truncate max-w-[200px]">
                              {cust.companyWebsite}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">{cust.industry}</td>
                        <td className="py-3 px-4 text-slate-400">{cust.businessUnit || '—'}</td>
                        <td className="py-3 px-4 text-slate-400">{cust.region || 'GLOBAL'}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {custAssessments.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsEditModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                          >
                            {strings.table.editAction}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            }`}
                          >
                            {isSelected ? 'Selected ✓' : strings.table.selectAction}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCustomerCreated}
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
        }}
        onUpdated={handleCustomerUpdated}
      />
    </div>
  );
};
