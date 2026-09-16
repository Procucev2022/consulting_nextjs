import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfilePage from '../../../src/app/profile/page';
import { authApiClient } from '../../../src/utils/authApi';
import { apiClient } from '../../../src/utils/api';

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn()
};
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />
}));

const mockUser = {
  id: 'BUYER-NAVIN-89',
  name: 'Navin Kumar',
  email: 'navin@enterprise.com',
  mobile_number: '+91 91234 56789',
  company_name: 'Apex Industrial Dynamics',
  company_address: 'Peenya Industrial Estate, Bengaluru',
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
  subscription_tier: 'ENTERPRISE_PRO',
  created_at: new Date('2025-01-15').toISOString()
};

const mockDocuments = [
  {
    doc_id: 'DOC-1001',
    tenant_id: 'BUYER-NAVIN-89',
    file_name: 'FY25_Purchase_Data.xlsx',
    file_type: 'xlsx',
    file_size_mb: 2.4,
    ocr_status: 'Completed' as const,
    progress: 100,
    uploaded_at: '2025-01-20T10:30:00.000Z',
    records_count: 1250,
    detected_currencies: ['INR', 'USD'],
    converted_inr_crores: 18.5
  },
  {
    doc_id: 'DOC-OTHER-99',
    tenant_id: 'OTHER-BUYER-77',
    file_name: 'Other_Buyer_Secret.xlsx',
    file_type: 'xlsx',
    file_size_mb: 5.0,
    ocr_status: 'Completed' as const,
    progress: 100,
    uploaded_at: '2025-01-21T10:30:00.000Z',
    records_count: 500,
    detected_currencies: ['USD'],
    converted_inr_crores: 30.0
  }
];

describe('Enterprise Profile Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    vi.spyOn(authApiClient, 'getMe').mockResolvedValue({ success: true, user: mockUser });
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({
      tenant_id: 'TNT-GLOBAL-8902',
      enterprise_name: 'Apex Industrial Dynamics',
      region: 'GLOBAL',
      base_currency: 'INR',
      status: 'ACTIVE',
      total_spend_evaluated: 100000000,
      total_spend_evaluated_inr: 8066.86,
      major_sector: 'Chemical & Petrochemicals',
      minor_sector: 'Specialty Chemicals'
    });
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: mockDocuments,
      validationRecords: []
    });
  });

  it('redirects to /login if user is not authenticated', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(null);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders profile with user information, Buyer ID, and isolated organization documents', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    vi.spyOn(authApiClient, 'getMe').mockResolvedValue({ success: true, user: mockUser });
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({
      tenant_id: 'TNT-GLOBAL-8902',
      enterprise_name: 'Apex Industrial Dynamics',
      region: 'GLOBAL',
      base_currency: 'INR',
      status: 'ACTIVE',
      total_spend_evaluated: 100000000,
      total_spend_evaluated_inr: 8066.86,
      major_sector: 'Chemical & Petrochemicals',
      minor_sector: 'Specialty Chemicals'
    });
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: mockDocuments,
      validationRecords: []
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Navin Kumar').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('BUYER-NAVIN-89')).toBeInTheDocument();
    expect(screen.getByText('navin@enterprise.com')).toBeInTheDocument();
    expect(screen.getByText('Peenya Industrial Estate, Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('Admin Directory')).toBeInTheDocument();

    // Verify own uploaded document is rendered
    expect(screen.getByText('FY25_Purchase_Data.xlsx')).toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();

    // Verify other buyer's document is filtered out
    expect(screen.queryByText('Other_Buyer_Secret.xlsx')).not.toBeInTheDocument();

    // Verify removed section is NOT present
    expect(screen.queryByText('Procurement Dataset & Workspace Status')).not.toBeInTheDocument();
  });

  it('handles "Use this Document" button click to autofill and navigate to dashboard', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: [mockDocuments[0]],
      validationRecords: []
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('FY25_Purchase_Data.xlsx')).toBeInTheDocument();
    });

    const useDocBtn = screen.getByRole('button', { name: /Use this Document/i });
    fireEvent.click(useDocBtn);

    expect(mockPush).toHaveBeenCalledWith('/');
    const savedDataset = sessionStorage.getItem('procucev_uploaded_dataset');
    expect(savedDataset).toContain('FY25_Purchase_Data.xlsx');
  });

  it('handles password change submission', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    const changePasswordSpy = vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({
      success: true,
      message: 'Your password has been successfully updated.'
    });

    const { container } = render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Change Account Password')).toBeInTheDocument();
    });

    const currInput = container.querySelector('#curr-password') as HTMLInputElement;
    const newInput = container.querySelector('#new-password') as HTMLInputElement;
    const confInput = container.querySelector('#conf-password') as HTMLInputElement;

    fireEvent.change(currInput, { target: { value: 'OldPassword@123' } });
    fireEvent.change(newInput, { target: { value: 'NewPassword@456' } });
    fireEvent.change(confInput, { target: { value: 'NewPassword@456' } });

    const submitBtn = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(changePasswordSpy).toHaveBeenCalledWith({
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@456'
      });
      expect(screen.getByText('Your password has been successfully updated.')).toBeInTheDocument();
    });
  });

  it('shows error if new password and confirm password do not match', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    const { container } = render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Change Account Password')).toBeInTheDocument();
    });

    const currInput = container.querySelector('#curr-password') as HTMLInputElement;
    const newInput = container.querySelector('#new-password') as HTMLInputElement;
    const confInput = container.querySelector('#conf-password') as HTMLInputElement;

    fireEvent.change(currInput, { target: { value: 'OldPassword@123' } });
    fireEvent.change(newInput, { target: { value: 'NewPassword@456' } });
    fireEvent.change(confInput, { target: { value: 'DifferentPassword@789' } });

    const submitBtn = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('allows deleting an uploaded document', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    vi.spyOn(authApiClient, 'getMe').mockResolvedValue({ success: true, user: mockUser });
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue({
      tenant_id: 'TNT-GLOBAL-8902',
      enterprise_name: 'Apex Industrial Dynamics',
      region: 'GLOBAL',
      base_currency: 'INR',
      status: 'ACTIVE',
      total_spend_evaluated: 100000000
    });
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: [mockDocuments[0]],
      validationRecords: []
    });
    const deleteSpy = vi.spyOn(apiClient, 'deleteIngestionDocument').mockResolvedValue([]);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('FY25_Purchase_Data.xlsx')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('DOC-1001', 'BUYER-NAVIN-89');
    });

    await waitFor(() => {
      expect(screen.getByText('Document successfully removed from repository.')).toBeInTheDocument();
      expect(screen.getByText('No Ingested Documents Found for this Account')).toBeInTheDocument();
    });
  });

  it('handles logout button click and redirects to /login', async () => {
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(mockUser);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-token');
    const clearSpy = vi.spyOn(authApiClient, 'clearStoredSession');
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(logoutBtn);

    expect(clearSpy).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
