'use client';

/**
 * Shared access-restriction card displayed when a non-administrator (buyer/standard USER)
 * attempts to access the Admin Portal gateway or admin authentication routes.
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import type { AdminBuyerBlockedCardProps } from '../../types';

export default function AdminBuyerBlockedCard({
  blockedUser
}: AdminBuyerBlockedCardProps): React.ReactElement {
  return (
    <section
      role="alert"
      data-testid="admin-buyer-blocked-panel"
      className="w-full max-w-xl bg-slate-900/95 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            {UI_STRINGS.admin.buyerAccessBlockedTitle}
          </h1>
          <p className="text-sm text-red-200 mt-1.5 leading-relaxed">
            {UI_STRINGS.admin.buyerAccessBlockedDescription(blockedUser.email, blockedUser.role)}
          </p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 leading-relaxed">
        {UI_STRINGS.admin.buyerAccessBlockedActionGuidance}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{UI_STRINGS.admin.returnToWorkspaceButton}</span>
        </Link>
      </div>
    </section>
  );
}
