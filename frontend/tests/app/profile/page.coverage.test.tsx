import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProfilePage from '../../../src/app/profile/page';
import { authApiClient } from '../../../src/utils/authApi';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants';
import type { RawDocumentIngestion, TenantMaster, UserProfile } from '../../../src/types';

const mockPush = vi.fn();
// The router must be a stable object: the page's data-loading effect depends on it.
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

vi.mock('next/image', async () => {
  const React = (await import('react')).default;
  return {
    default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt })
  };
});

// Labels and storage keys that the page defines inline rather than in UI_STRINGS.
const DELETE_BUTTON_LABEL = 'Delete';
const USE_DOCUMENT_BUTTON_LABEL = 'Use this Document';
const DARK_THEME_TITLE = 'Switch to Dark Theme';
const LIGHT_THEME_TITLE = 'Switch to Light Theme';
const THEME_STORAGE_KEY = 'procucev_theme';
const UPLOADED_DATASET_KEY = 'procucev_uploaded_dataset';
const SESSION_TOKEN = 'session-token-123';

const PROFILE_USER: UserProfile = {
  id: 'BUYER-ACME-001',
  name: 'Asha Verma',
  email: 'asha.verma@acme.example',
  mobile_number: '+91 98765 43210',
  company_name: 'Acme Industries',
  company_address: 'Plot 45, Peenya Industrial Area, Bengaluru',
  role: 'USER',
  status: 'ACTIVE',
  subscription_tier: 'ENTERPRISE_PRO',
  created_at: '2025-11-03T00:00:00.000Z'
};

const TENANT: TenantMaster = {
  enterprise_name: 'Acme Industries Holdings',
  major_sector: 'Automotive',
  minor_sector: 'Tier-1 Components',
  base_currency: 'USD'
} as TenantMaster;

const buildDocument = (overrides: Partial<RawDocumentIngestion>): RawDocumentIngestion =>
  ({
    doc_id: 'doc-own-1',
    file_name: 'Q1_Spend.xlsx',
    tenant_id: PROFILE_USER.id,
    file_type: 'XLSX',
    ocr_status: 'Completed',
    file_size_mb: 2.4,
    records_count: 1200,
    converted_inr_crores: 14.5,
    detected_currencies: ['INR', 'USD'],
    uploaded_at: '2026-02-01T10:00:00.000Z',
    ...overrides
  }) as RawDocumentIngestion;

const DOC_OWN = buildDocument({});
const DOC_EMAIL_SCOPED = buildDocument({
  doc_id: 'doc-email-2',
  file_name: 'Email_Scoped.csv',
  tenant_id: PROFILE_USER.email
});
const DOC_SHARED = buildDocument({ doc_id: 'doc-shared-3', file_name: 'Shared_Catalogue.csv', tenant_id: undefined });
const DOC_OTHER_BUYER = buildDocument({ doc_id: 'doc-other-4', file_name: 'Other_Buyer.xlsx', tenant_id: 'BUYER-OTHER-9' });
const DOC_SPARSE = buildDocument({
  doc_id: 'doc-sparse-5',
  file_name: 'Sparse_Import.csv',
  file_type: undefined,
  ocr_status: undefined,
  records_count: undefined,
  converted_inr_crores: undefined,
  detected_currencies: undefined,
  uploaded_at: undefined
});

const installClipboard = (): { writeText: ReturnType<typeof vi.fn> } => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return { writeText };
};

const renderProfile = async (): Promise<ReturnType<typeof render>> => {
  const view = render(<ProfilePage />);
  await screen.findByRole('heading', { level: 1, name: PROFILE_USER.name });
  return view;
};

describe('ProfilePage coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
    vi.spyOn(authApiClient, 'getStoredUser').mockReturnValue(PROFILE_USER);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(SESSION_TOKEN);
    vi.spyOn(authApiClient, 'getMe').mockResolvedValue({ user: PROFILE_USER } as never);
    vi.spyOn(authApiClient, 'setStoredSession').mockImplementation(() => undefined);
    vi.spyOn(authApiClient, 'clearStoredSession').mockImplementation(() => undefined);
    vi.spyOn(apiClient, 'getTenant').mockResolvedValue(TENANT);
    vi.spyOn(apiClient, 'getIngestionData').mockResolvedValue({
      queue: [DOC_OWN, DOC_EMAIL_SCOPED, DOC_SHARED, DOC_OTHER_BUYER]
    } as never);
    vi.spyOn(apiClient, 'deleteIngestionDocument').mockResolvedValue([] as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
    mockPush.mockReset();
  });

  it('redirects visitors without any session to the sign-in page and renders no data requests', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);

    render(<ProfilePage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
    expect(apiClient.getTenant).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('sends administrators from the stored session to the admin dashboard', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...PROFILE_USER, role: 'ADMIN' });

    render(<ProfilePage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
    expect(apiClient.getTenant).not.toHaveBeenCalled();
  });

  it('sends administrators from a refreshed profile to the admin dashboard', async () => {
    vi.mocked(authApiClient.getMe).mockResolvedValue({ user: { ...PROFILE_USER, role: 'ADMIN' } } as never);

    render(<ProfilePage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
    expect(authApiClient.setStoredSession).not.toHaveBeenCalled();
  });

  it('shows the refreshed profile, tenant details, and the documents that belong to this buyer', async () => {
    vi.mocked(authApiClient.getMe).mockResolvedValue({
      user: { ...PROFILE_USER, name: 'Asha Verma (Refreshed)' }
    } as never);

    render(<ProfilePage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Asha Verma (Refreshed)' })).toBeInTheDocument();
    expect(screen.getByText(TENANT.major_sector)).toBeInTheDocument();
    expect(screen.getByText(TENANT.minor_sector)).toBeInTheDocument();
    expect(screen.getByText(DOC_OWN.file_name)).toBeInTheDocument();
    expect(screen.getByText(DOC_EMAIL_SCOPED.file_name)).toBeInTheDocument();
    expect(screen.getByText(DOC_SHARED.file_name)).toBeInTheDocument();
    expect(screen.queryByText(DOC_OTHER_BUYER.file_name)).not.toBeInTheDocument();
    expect(authApiClient.setStoredSession).toHaveBeenCalledWith(
      SESSION_TOKEN,
      expect.objectContaining({ name: 'Asha Verma (Refreshed)' })
    );
  });

  it('lists every queued document when the stored user carries no identifier', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...PROFILE_USER, id: '' });

    await renderProfile();

    expect(screen.getByText(DOC_OTHER_BUYER.file_name)).toBeInTheDocument();
  });

  it('renders the empty repository state when no documents are queued', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue({ queue: [] } as never);

    await renderProfile();

    expect(screen.queryByText(DOC_OWN.file_name)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: DELETE_BUTTON_LABEL })).toHaveLength(0);
  });

  it('treats an ingestion response without a queue as an empty repository', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue({} as never);

    await renderProfile();

    expect(screen.queryAllByRole('button', { name: DELETE_BUTTON_LABEL })).toHaveLength(0);
  });

  it('falls back to default presentation values for sparse document records', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue({ queue: [DOC_SPARSE] } as never);

    await renderProfile();

    expect(screen.getByText(DOC_SPARSE.file_name)).toBeInTheDocument();
    expect(screen.getByText('XLSX')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('INR')).toBeInTheDocument();
  });

  it('shows fallback initials and join date for a profile without a name or creation date', async () => {
    const nameless = { ...PROFILE_USER, name: '', created_at: undefined };
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(nameless);
    vi.mocked(authApiClient.getMe).mockResolvedValue({ user: nameless } as never);

    render(<ProfilePage />);

    expect(await screen.findByText(PROFILE_USER.id)).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('keeps the stored profile when the tenant, refresh, and ingestion lookups fail', async () => {
    vi.mocked(apiClient.getTenant).mockRejectedValue(new Error('tenant service down'));
    vi.mocked(authApiClient.getMe).mockRejectedValue(new Error('session refresh failed'));
    vi.mocked(apiClient.getIngestionData).mockRejectedValue(new Error('ingestion unavailable'));

    await renderProfile();

    expect(screen.getAllByText(PROFILE_USER.company_name).length).toBeGreaterThan(0);
    expect(authApiClient.setStoredSession).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button', { name: DELETE_BUTTON_LABEL })).toHaveLength(0);
  });

  it('uses the stored profile without a refresh request when no token is stored', async () => {
    vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);

    await renderProfile();

    expect(authApiClient.getMe).not.toHaveBeenCalled();
    expect(authApiClient.setStoredSession).not.toHaveBeenCalled();
  });

  it('loads documents with a token alone when the stored user is missing', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getMe).mockRejectedValue(new Error('session refresh failed'));

    render(<ProfilePage />);

    await waitFor(() => expect(apiClient.getIngestionData).toHaveBeenCalledWith(undefined));
    expect(mockPush).not.toHaveBeenCalledWith('/login');
  });

  it('does not apply loaded data after the page has unmounted', async () => {
    const { unmount } = render(<ProfilePage />);
    unmount();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(apiClient.getTenant).toHaveBeenCalled();
    expect(authApiClient.setStoredSession).not.toHaveBeenCalled();
  });

  it('starts in dark mode when the previous visit stored the dark theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    await renderProfile();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('starts in dark mode when the page root is already dark and nothing is stored', async () => {
    document.documentElement.classList.add('dark');

    await renderProfile();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('switches between light and dark themes and persists the choice', async () => {
    await renderProfile();

    fireEvent.click(screen.getByTitle(DARK_THEME_TITLE));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByTitle(LIGHT_THEME_TITLE));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('copies the buyer identifier and clears the confirmation after two seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { writeText } = installClipboard();
    await renderProfile();

    const identifier = screen.getByText(PROFILE_USER.id);
    fireEvent.click(within(identifier.parentElement as HTMLElement).getByRole('button'));

    expect(writeText).toHaveBeenCalledWith(PROFILE_USER.id);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });

  it('does not copy anything when the profile has no loaded identifier', async () => {
    const { writeText } = installClipboard();
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);
    const { container } = render(<ProfilePage />);
    await screen.findByRole('heading', { level: 1 });
    const identifier = container.querySelector('code') as HTMLElement;

    fireEvent.click(within(identifier.parentElement as HTMLElement).getByRole('button'));

    expect(writeText).not.toHaveBeenCalled();
  });

  it('submits a password change and shows the confirmation the service returns', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({ success: true, message: 'Password updated.' } as never);
    const { container } = await renderProfile();
    const submitButton = screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), {
      target: { value: 'old-secret' }
    });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), {
      target: { value: 'new-secret-1' }
    });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), {
      target: { value: 'new-secret-1' }
    });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    expect(await screen.findByRole('status')).toHaveTextContent('Password updated.');
    expect(authApiClient.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-secret',
      newPassword: 'new-secret-1'
    });
    expect(container.querySelector('#curr-password')).toHaveValue('');
  });

  it('shows the default confirmation when the password service returns no message', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({ success: true } as never);
    await renderProfile();
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), { target: { value: 'fresh-pass' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), { target: { value: 'fresh-pass' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton }));

    expect(await screen.findByRole('status')).toHaveTextContent(UI_STRINGS.auth.passwordChangedSuccess);
  });

  it('rejects a confirmation that does not match without calling the service', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({ success: true } as never);
    await renderProfile();
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), { target: { value: 'fresh-pass' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), { target: { value: 'different' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton }));

    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.auth.passwordMismatchError);
    expect(authApiClient.changePassword).not.toHaveBeenCalled();
  });

  it('rejects a new password shorter than six characters without calling the service', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({ success: true } as never);
    await renderProfile();
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), { target: { value: 'abc' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(authApiClient.changePassword).not.toHaveBeenCalled();
  });

  it('shows the service error message when the password change is rejected', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockRejectedValue(new Error('Current password is incorrect'));
    await renderProfile();
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), { target: { value: 'fresh-pass' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), { target: { value: 'fresh-pass' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
  });

  it('shows a generic failure when the password change rejects with a non-Error value', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockRejectedValue('gateway timeout');
    await renderProfile();
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), { target: { value: 'fresh-pass' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), { target: { value: 'fresh-pass' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to change password');
  });

  it('shows the pending state while the password change is in flight', async () => {
    let resolveChange: (value: unknown) => void = () => undefined;
    vi.spyOn(authApiClient, 'changePassword').mockReturnValue(
      new Promise((resolve) => {
        resolveChange = resolve;
      }) as never
    );
    const { container } = await renderProfile();
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.currentPasswordLabel)), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.newPasswordLabel)), { target: { value: 'fresh-pass' } });
    fireEvent.change(screen.getByLabelText(new RegExp(UI_STRINGS.auth.confirmPasswordLabel)), { target: { value: 'fresh-pass' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.changePasswordButton }));

    await waitFor(() => expect(container.querySelector('#btn-change-password-submit')).toBeDisabled());
    resolveChange({ success: true, message: 'Done.' });
    expect(await screen.findByRole('status')).toHaveTextContent('Done.');
  });

  it('toggles the visibility of each password field independently', async () => {
    const { container } = await renderProfile();
    const fieldIds = ['#curr-password', '#new-password', '#conf-password'];

    fieldIds.forEach((fieldId) => {
      const input = container.querySelector(fieldId) as HTMLInputElement;
      expect(input).toHaveAttribute('type', 'password');
      const toggle = within(input.parentElement as HTMLElement).getByRole('button');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  it('removes a document from the repository and clears the confirmation after three seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(apiClient.deleteIngestionDocument).mockResolvedValueOnce([DOC_EMAIL_SCOPED, DOC_SHARED] as never);
    await renderProfile();

    fireEvent.click(screen.getAllByRole('button', { name: DELETE_BUTTON_LABEL })[0]);

    await waitFor(() => expect(screen.queryByText(DOC_OWN.file_name)).not.toBeInTheDocument());
    expect(apiClient.deleteIngestionDocument).toHaveBeenCalledWith(DOC_OWN.doc_id, PROFILE_USER.id);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });

  it('shows the spinner on the document being deleted until the request settles', async () => {
    let resolveDelete: (value: unknown) => void = () => undefined;
    vi.mocked(apiClient.deleteIngestionDocument).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDelete = resolve;
      }) as never
    );
    await renderProfile();

    const [firstDelete] = screen.getAllByRole('button', { name: DELETE_BUTTON_LABEL });
    fireEvent.click(firstDelete);

    await waitFor(() => expect(firstDelete).toBeDisabled());
    resolveDelete([DOC_EMAIL_SCOPED, DOC_SHARED]);
    await waitFor(() => expect(screen.queryByText(DOC_OWN.file_name)).not.toBeInTheDocument());
  });

  it('treats an empty deletion response as an empty repository', async () => {
    vi.mocked(apiClient.deleteIngestionDocument).mockResolvedValueOnce(null as never);
    await renderProfile();

    fireEvent.click(screen.getAllByRole('button', { name: DELETE_BUTTON_LABEL })[0]);
    await waitFor(() => expect(apiClient.deleteIngestionDocument).toHaveBeenCalledWith(DOC_OWN.doc_id, PROFILE_USER.id));

    await waitFor(() => expect(screen.queryAllByRole('button', { name: DELETE_BUTTON_LABEL })).toHaveLength(0));
  });

  it('shows the service message when a document deletion is rejected', async () => {
    vi.mocked(apiClient.deleteIngestionDocument).mockRejectedValueOnce(new Error('Document is locked by an ingestion job'));
    await renderProfile();

    fireEvent.click(screen.getAllByRole('button', { name: DELETE_BUTTON_LABEL })[0]);

    expect(await screen.findByText('Document is locked by an ingestion job')).toBeInTheDocument();
    expect(screen.getByText(DOC_OWN.file_name)).toBeInTheDocument();
  });

  it('shows a generic message when a document deletion rejects with a non-Error value', async () => {
    vi.mocked(apiClient.deleteIngestionDocument).mockRejectedValueOnce('connection reset');
    await renderProfile();

    fireEvent.click(screen.getAllByRole('button', { name: DELETE_BUTTON_LABEL })[0]);

    expect(await screen.findByText('Failed to delete document')).toBeInTheDocument();
  });

  it('does not call the delete service for a document without an identifier', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue({
      queue: [buildDocument({ doc_id: undefined, file_name: 'Unidentified_Upload.csv' })]
    } as never);
    await renderProfile();

    fireEvent.click(screen.getByRole('button', { name: DELETE_BUTTON_LABEL }));

    expect(apiClient.deleteIngestionDocument).not.toHaveBeenCalled();
  });

  it('deletes with the stored identifier when the profile could not be refreshed', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getMe).mockRejectedValue(new Error('session refresh failed'));
    vi.mocked(apiClient.getIngestionData).mockResolvedValue({ queue: [DOC_SHARED] } as never);
    vi.mocked(apiClient.deleteIngestionDocument).mockResolvedValueOnce([] as never);
    render(<ProfilePage />);
    await screen.findByText(DOC_SHARED.file_name);

    fireEvent.click(screen.getByRole('button', { name: DELETE_BUTTON_LABEL }));

    await waitFor(() => expect(apiClient.deleteIngestionDocument).toHaveBeenCalledWith(DOC_SHARED.doc_id, undefined));
  });

  it('stores a document for the workspace and navigates to the home page', async () => {
    await renderProfile();

    fireEvent.click(screen.getAllByRole('button', { name: USE_DOCUMENT_BUTTON_LABEL })[0]);

    const stored = JSON.parse(window.sessionStorage.getItem(UPLOADED_DATASET_KEY) as string) as { doc: RawDocumentIngestion };
    expect(stored.doc.doc_id).toBe(DOC_OWN.doc_id);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('signs out, clears the stored session, and returns to the sign-in page', async () => {
    await renderProfile();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.logout }));

    expect(authApiClient.clearStoredSession).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
