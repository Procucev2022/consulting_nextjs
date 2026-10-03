'use client';

import React, { useState } from 'react';
import type { UploadPrivacyConfirmationBoxProps } from '../types/components';
import { UI_STRINGS } from '../constants/uiStrings';

/**
 * Upload Privacy Confirmation Box (Prompt 254 Section 10)
 * Displays explicit tenant privacy notice and mandatory acknowledgment checkbox before processing.
 */
export const UploadPrivacyConfirmationBox: React.FC<UploadPrivacyConfirmationBoxProps> = ({
  isChecked,
  onToggle,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  return (
    <div
      className={`rounded-lg border border-slate-700 bg-white p-4 text-slate-200 shadow-sm backdrop-blur ${className}`}
      data-testid="upload-privacy-confirmation-box"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span role="img" aria-label="Privacy Lock">🔒</span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white tracking-wide">
            {UI_STRINGS.enterprisePrivacy.uploadModalTitle}
          </h4>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            {UI_STRINGS.enterprisePrivacy.uploadModalBody}
          </p>

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline focus:outline-none"
            aria-expanded={showDetails}
            aria-controls="upload-data-protection-details"
          >
            {showDetails
              ? UI_STRINGS.enterprisePrivacy.hideDetailsLink
              : UI_STRINGS.enterprisePrivacy.viewDetailsLink}
          </button>

          {showDetails && (
            <div
              id="upload-data-protection-details"
              className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-2 bg-[#F8FBFE] p-3 rounded"
            >
              <p>• {UI_STRINGS.enterprisePrivacy.uploadNotice}</p>
              <p>• {UI_STRINGS.enterprisePrivacy.nonEnrichmentNotice}</p>
              <p>• {UI_STRINGS.enterprisePrivacy.encryptionNotice}</p>
              <p>• {UI_STRINGS.enterprisePrivacy.pcbiSeparationNotice}</p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2.5">
            <input
              id="privacy-acknowledgment-checkbox"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onToggle(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-[#EEF4FC] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <label
              htmlFor="privacy-acknowledgment-checkbox"
              className="text-xs text-slate-200 select-none cursor-pointer font-medium"
            >
              {UI_STRINGS.enterprisePrivacy.uploadCheckboxLabel}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPrivacyConfirmationBox;
