import React from 'react';
import type { AssessmentAuditTabProps } from '../../types';

export const AssessmentAuditTab: React.FC<AssessmentAuditTabProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-2">
      {auditLogs.map((log) => (
        <div key={log.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-cyan-300">{log.action}</span>
            <span className="text-slate-400 ml-2">by {log.actorEmail} ({log.actorRole})</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(log.timestamp).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};
