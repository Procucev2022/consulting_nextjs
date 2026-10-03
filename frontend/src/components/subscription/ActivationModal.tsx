'use client';

/**
 * Customer Subscription Activation Modal (Prompt 288 §18)
 */

import React, { useState } from 'react';
import { KeyRound, CheckCircle, AlertTriangle, X } from 'lucide-react';
import type { ActivationModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  customerEmail,
  onActivationSuccess
}) => {
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) {
      setErrorMessage('Activation code is required');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          activation_code: activationCode.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Activation failed');
      }

      setSuccessMessage(UI_STRINGS.subscription.activationSuccess);
      onActivationSuccess(data.subscription);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-testid="activation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FBFE] backdrop-blur-md p-4"
    >
      <div
        data-testid="activation-modal"
        className="relative w-full max-w-md bg-white border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-1.5">
            {UI_STRINGS.subscription.activationModalTitle}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            {UI_STRINGS.subscription.activationModalSubtitle}
          </p>
        </div>

        {errorMessage && (
          <div
            data-testid="activation-error"
            className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            data-testid="activation-success"
            className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="activation-code-input"
              className="block text-xs font-bold text-slate-300 mb-1.5"
            >
              {UI_STRINGS.subscription.activationCodeLabel}
            </label>
            <input
              id="activation-code-input"
              data-testid="activation-code-input"
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder={UI_STRINGS.subscription.activationCodePlaceholder}
              className="w-full px-4 py-2.5 bg-[#F8FBFE] border border-slate-700 rounded-xl text-center font-mono font-bold tracking-widest text-cyan-400 text-base focus:border-cyan-500 focus:outline-none"
              disabled={isLoading || Boolean(successMessage)}
            />
          </div>

          <button
            type="submit"
            data-testid="submit-activation-btn"
            disabled={isLoading || Boolean(successMessage)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Activating...' : UI_STRINGS.subscription.activateSubscription}
          </button>
        </form>
      </div>
    </div>
  );
};
