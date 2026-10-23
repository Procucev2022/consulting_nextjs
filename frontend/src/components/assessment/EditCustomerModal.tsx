'use client';

import React, { useState, useEffect } from 'react';
import type { EditCustomerModalProps, CustomerRecord } from '../../types';
import { UI_STRINGS } from '../../constants';
import { assessmentApiClient } from '../../utils/assessmentApi';
import frontendLogger from '../../utils/logger';

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onUpdated
}) => {
  const [customerName, setCustomerName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [region, setRegion] = useState('GLOBAL');
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.customerName || '');
      setIndustry(customer.industry || '');
      setCompanyWebsite(customer.companyWebsite || '');
      setBusinessUnit(customer.businessUnit || '');
      setRegion(customer.region || 'GLOBAL');
      setBaseCurrency(customer.baseCurrency || 'INR');
      setContactPerson(customer.contactPerson || '');
      setContactEmail(customer.contactEmail || '');
      setNotes(customer.notes || '');
      setErrorMsg(null);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !industry.trim()) {
      setErrorMsg('Customer name and industry are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      frontendLogger.info('Updating customer profile', { customerId: customer.id, customerName: customerName.trim() });
      const updated: CustomerRecord = await assessmentApiClient.updateCustomer(customer.id, {
        customerName: customerName.trim(),
        industry: industry.trim(),
        companyWebsite: companyWebsite.trim() || undefined,
        businessUnit: businessUnit.trim() || undefined,
        region: region.trim() || undefined,
        baseCurrency: baseCurrency.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update customer';
      frontendLogger.error('Customer profile update failed', { customerId: customer.id, error: msg });
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const strings = UI_STRINGS.ASSESSMENT.customerManagement;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-customer-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 id="edit-customer-modal-title" className="text-xl font-bold text-white tracking-wide">
              {strings.modalEdit.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {customer.id} — {strings.modalEdit.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-bold px-2 py-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {strings.modalCreate.fieldName}
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. ABC Textile Ltd"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {strings.modalCreate.fieldIndustry}
              </label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Textile, Automotive"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              {strings.modalEdit.fieldCompanyWebsite}
            </label>
            <input
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder={strings.modalEdit.fieldCompanyWebsitePlaceholder}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {strings.modalCreate.fieldBusinessUnit}
              </label>
              <input
                type="text"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                placeholder="e.g. Procurement Operations"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {strings.modalCreate.fieldRegion}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="APAC">APAC (Asia-Pacific)</option>
                <option value="GLOBAL">GLOBAL</option>
                <option value="NA">NA (North America)</option>
                <option value="EU">EU (Europe)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {strings.modalCreate.fieldContactPerson}
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {strings.modalCreate.fieldContactEmail}
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. procurement@client.com"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              {strings.modalCreate.fieldNotes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enterprise client notes, governance parameters..."
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {customer.websiteProfile && (
            <div className="p-3 rounded-lg bg-slate-800/80 border border-cyan-800/50 space-y-2 text-xs">
              <div className="flex items-center justify-between text-cyan-400 font-semibold uppercase tracking-wider">
                <span>{strings.modalEdit.websiteIntelSection}</span>
                {customer.websiteProfile.reportingPeriod && (
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    Period: {customer.websiteProfile.reportingPeriod}
                  </span>
                )}
              </div>
              <p className="text-slate-300">{customer.websiteProfile.businessDescription}</p>
              <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
                <div>
                  <span className="text-slate-500">Footprint: </span>
                  <span className="text-slate-200">{customer.websiteProfile.operatingFootprint}</span>
                </div>
                {customer.websiteProfile.revenueOrProfit && (
                  <div>
                    <span className="text-slate-500">Revenue / EBITDA: </span>
                    <span className="text-cyan-300 font-semibold">{customer.websiteProfile.revenueOrProfit}</span>
                  </div>
                )}
              </div>
              {customer.websiteProfile.sourceUrls && customer.websiteProfile.sourceUrls.length > 0 && (
                <div className="text-[10px] text-slate-500 pt-1 truncate">
                  Source: <span className="text-cyan-500 underline">{customer.websiteProfile.sourceUrls[0]}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              {strings.modalEdit.btnCancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/50 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : strings.modalEdit.btnSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
