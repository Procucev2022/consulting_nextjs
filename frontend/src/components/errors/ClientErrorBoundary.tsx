'use client';

import { Component, type ErrorInfo } from 'react';
import { UI_STRINGS } from '../../constants/uiStrings';
import type { ClientErrorBoundaryProps, ClientErrorBoundaryState } from '../../types/errors';
import { frontendLogger } from '../../utils/logger';
import { createClientRequestId, sendClientErrorReport } from '../../utils/clientErrorTelemetry';

export class ClientErrorBoundary extends Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  public state: ClientErrorBoundaryState = { hasError: false, error: null, requestId: '' };

  public static getDerivedStateFromError(error: Error): Partial<ClientErrorBoundaryState> {
    return { hasError: true, error, requestId: createClientRequestId() };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    const reportEntry = frontendLogger.error(UI_STRINGS.errors.boundary.logMessage, {
      source: 'react-boundary',
      requestId: this.state.requestId,
      componentStack: info.componentStack
    }, error);
    void sendClientErrorReport(reportEntry, 'react-boundary');
  }

  public render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <main role="alert" className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-12 text-slate-900">
        <h1 className="text-2xl font-semibold">{UI_STRINGS.errors.boundary.title}</h1>
        <p>{UI_STRINGS.errors.boundary.message}</p>
        <p>{UI_STRINGS.errors.boundary.nextStep}</p>
        <p className="font-mono text-sm">{UI_STRINGS.errors.boundary.supportReference(this.state.requestId)}</p>
        <button
          className="w-fit rounded bg-sky-700 px-4 py-2 font-medium text-white"
          onClick={() => window.location.reload()}
          type="button"
        >
          {UI_STRINGS.errors.boundary.reloadAction}
        </button>
      </main>
    );
  }
}
