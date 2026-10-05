'use client';

/**
 * Enterprise Admin Active Session Card Component
 * Displays authenticated administrator profile with quick actions.
 */

import React from 'react';
import { Shield, CheckCircle2, LayoutDashboard, CreditCard, Cpu, LogOut, PlusCircle } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import type { AdminActiveSessionCardProps } from '../../types';

export default function AdminActiveSessionCard({
  user,
  onSignOut,
  onOpenDashboard,
  onOpenCreateAdmin
}: AdminActiveSessionCardProps): React.ReactElement {
  return (
    <div className="w-full bg-slate-900/90 border border-sky-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {user.name || 'System Administrator'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-semibold">
                {user.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {user.status}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5 font-mono">
              {user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.admin.signOutButton}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <button
          type="button"
          onClick={onOpenDashboard}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{UI_STRINGS.admin.openDashboardButton}</span>
        </button>

        <a
          href="/admin/subscriptions"
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>{UI_STRINGS.admin.openSubscriptionsButton}</span>
        </a>

        <a
          href="/admin/pcbi"
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>{UI_STRINGS.admin.openPcbiButton}</span>
        </a>
      </div>

      {onOpenCreateAdmin && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onOpenCreateAdmin}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.admin.createHeading}</span>
          </button>
        </div>
      )}
    </div>
  );
}
