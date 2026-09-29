import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatabaseViewSection } from '../../src/components/DatabaseViewSection';
import { apiClient } from '../../src/utils/api';

describe('DatabaseViewSection Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'getDBStatus').mockResolvedValue({
      isConnected: true,
      databaseName: 'consulting-db (D1)',
      databaseEngine: 'Cloudflare D1 SQLite Engine',
      latencyMs: 12,
      tablesCount: 11,
      totalRecords: 150,
      recordCounts: {
        users: 10,
        tenants: 2,
        spendCategories: 5,
        validationRecords: 20,
        rawDocuments: 4,
        categoryYearDetails: 15,
        vendorYearDetails: 30,
        vendorPriceRanks: 25,
        lineItemMappings: 18,
        savingsOpportunities: 12,
        conversionFunnelPhases: 9
      }
    } as any);

    vi.spyOn(apiClient, 'getDBTableData').mockResolvedValue({
      tableName: 'User',
      columns: ['id', 'email', 'name', 'role'],
      total: 2,
      page: 1,
      limit: 15,
      totalPages: 1,
      rows: [
        { id: 'usr-1', email: 'admin@procucev.com', name: 'Admin', role: 'ADMIN' },
        { id: 'usr-2', email: 'user@procucev.com', name: 'User', role: 'USER' }
      ]
    } as any);

    vi.spyOn(apiClient, 'testDBConnection').mockResolvedValue({
      success: true,
      latencyMs: 8,
      message: 'Cloudflare D1 reachable'
    } as any);
  });

  it('renders DatabaseViewSection with live telemetry and tables list', async () => {
    render(<DatabaseViewSection />);

    expect(screen.getByText('Cloudflare D1 Live Database')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('CONNECTED')).toBeInTheDocument();
      expect(screen.getByText('12 ms')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('handles ping connection test button click', async () => {
    render(<DatabaseViewSection />);

    const pingBtn = screen.getByText('Test Connection');
    fireEvent.click(pingBtn);

    await waitFor(() => {
      expect(screen.getByText(/⚡ Connected \(8ms round-trip\)/)).toBeInTheDocument();
    });
  });

  it('switches table selection and searches within table', async () => {
    render(<DatabaseViewSection />);

    await waitFor(() => {
      expect(screen.getByText('admin@procucev.com')).toBeInTheDocument();
    });

    const tenantTab = screen.getByText('Tenant Master');
    fireEvent.click(tenantTab);

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'admin' } });

    expect(searchInput).toHaveValue('admin');
  });

  it('opens and closes JSON record inspector modal', async () => {
    render(<DatabaseViewSection />);

    await waitFor(() => {
      expect(screen.getAllByText('JSON')[0]).toBeInTheDocument();
    });

    const jsonBtn = screen.getAllByText('JSON')[0];
    fireEvent.click(jsonBtn);

    expect(screen.getByText(/Record Inspector:/)).toBeInTheDocument();

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Record Inspector:/)).not.toBeInTheDocument();
    });
  });
});
