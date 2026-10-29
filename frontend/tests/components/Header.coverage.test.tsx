import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { mockTenant } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type {
  AssessmentRecord,
  OperatingModeConfig,
  UserProfile
} from '../../src/types';

type MockLinkProps = {
  href: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  title?: string;
};

// Client-side link navigation is not available in this environment, so links render as plain anchors
// that report clicks without letting jsdom attempt a page navigation.
vi.mock('next/link', () => ({
  default: ({ href, onClick, children, className, id, title }: MockLinkProps) => (
    <a
      href={href}
      className={className}
      id={id}
      title={title}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  )
}));

const header = UI_STRINGS.header;
const HOVER_CLOSE_DELAY_MS = 200;

const internalMode: OperatingModeConfig = {
  mode: 'INTERNAL_ASSESSMENT',
  isInternalAssessment: true,
  isPublicSaaS: false,
  workspaceTitle: 'Internal Assessment Workspace',
  phaseName: 'Coverage Phase',
  features: {
    publicRegistration: false,
    tierUpgrade: false,
    subscriptionPurchase: false,
    customerSelfOnboarding: false,
    customerSaaSDashboard: false,
    assessmentCentre: true
  },
  allowedRoles: ['INTERNAL_ADMIN', 'ANALYST', 'CONSULTANT']
};

const buildUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'usr-coverage-1',
  name: 'Navin Coverage',
  full_name: 'Navin Coverage',
  email: 'navin@enterprise.com',
  role: 'USER',
  status: 'ACTIVE',
  subscription_tier: 'BRONZE',
  ...overrides
});

const buildAssessment = (overrides: Partial<AssessmentRecord> = {}): AssessmentRecord => ({
  assessmentId: 'AIC-2026-0100',
  customerName: 'Acme Heavy Industries',
  industry: 'Manufacturing',
  assessmentPeriodStart: '2024-01-01',
  assessmentPeriodEnd: '2024-12-31',
  ndaStatus: 'SIGNED',
  dataStatus: 'AWAITING_DATA',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'DRAFT',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z',
  ...overrides
});

const baseProps = {
  tenant: mockTenant,
  onSelectTenant: vi.fn(),
  currency: 'INR' as const,
  onSelectCurrency: vi.fn(),
  onOpenReport: vi.fn(),
  theme: 'light' as const,
  onSelectTheme: vi.fn()
};

const menuButton = (): HTMLElement => screen.getByTestId('user-profile-menu-button');

const profileMenuContainer = (): HTMLElement => {
  const container = menuButton().parentElement;
  if (!container) {
    throw new Error('Profile menu container was not rendered');
  }
  return container;
};

// Scoped to the open profile dropdown so the header logo link (also pointing at "/") is never matched.
const dropdownLinkTo = (href: string): HTMLElement => {
  const dropdown = screen.getByTestId('user-profile-dropdown');
  const link = within(dropdown)
    .getAllByRole('link')
    .find((element) => element.getAttribute('href') === href);
  if (!link) {
    throw new Error(`No dropdown link rendered for ${href}`);
  }
  return link;
};

// Icon-only buttons have no text content. In these tests the enquiry modal close control is the only one.
const iconOnlyButtons = (): HTMLElement[] =>
  screen.getAllByRole('button').filter((button) => button.textContent?.trim() === '');

const closeIconButton = (): HTMLElement => {
  const [button] = iconOnlyButtons();
  if (!button) {
    throw new Error('Enquiry modal close control was not rendered');
  }
  return button;
};

const openProfileMenu = (): void => {
  fireEvent.click(menuButton());
};

const pause = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

describe('Header coverage', () => {
  it('opens the profile menu on hover and closes it after the pointer leaves', async () => {
    render(<Header {...baseProps} currentUser={buildUser()} />);
    const container = profileMenuContainer();

    fireEvent.mouseEnter(container);
    expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();

    fireEvent.mouseLeave(container);
    await waitFor(() => {
      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
    });
  });

  it('cancels a pending close when the pointer returns within the close delay', async () => {
    render(<Header {...baseProps} currentUser={buildUser()} />);
    const container = profileMenuContainer();

    fireEvent.mouseEnter(container);
    fireEvent.mouseLeave(container);
    fireEvent.mouseEnter(container);
    await act(async () => {
      await pause(HOVER_CLOSE_DELAY_MS + 50);
    });

    expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();
  });

  it('clears a pending hover close timer when the header unmounts', () => {
    const { unmount } = render(<Header {...baseProps} currentUser={buildUser()} />);
    const container = profileMenuContainer();

    fireEvent.mouseEnter(container);
    fireEvent.mouseLeave(container);
    unmount();

    expect(screen.queryByTestId('user-profile-menu-button')).not.toBeInTheDocument();
  });

  it('closes the profile menu when the profile or workspace link is followed', () => {
    render(<Header {...baseProps} currentUser={buildUser()} />);

    openProfileMenu();
    fireEvent.click(dropdownLinkTo('/profile'));
    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();

    openProfileMenu();
    fireEvent.click(dropdownLinkTo('/'));
    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
  });

  it('closes the profile menu when a signed-out visitor follows the sign-in link', () => {
    render(<Header {...baseProps} currentUser={null} />);

    openProfileMenu();
    fireEvent.click(dropdownLinkTo('/login'));
    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
  });

  it('opens the enquiry modal from the plan upgrade button and closes it from its icon control', () => {
    render(<Header {...baseProps} currentUser={buildUser()} currentTier="BRONZE" />);

    openProfileMenu();
    fireEvent.click(screen.getByTestId('upgrade-to-silver-btn'));

    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
    expect(screen.getAllByText(/SILVER/).length).toBeGreaterThan(0);

    fireEvent.click(closeIconButton());
    expect(iconOnlyButtons()).toHaveLength(0);
  });

  it('shows the account name when the role is blank and no full name is stored', () => {
    render(<Header {...baseProps} currentUser={buildUser({ role: '', full_name: undefined, name: 'Priya Rao' })} />);

    expect(screen.getByText('Priya Rao')).toBeInTheDocument();
  });

  it('opens the report from the management summary through the report handler when no brief handler exists', () => {
    const onOpenReport = vi.fn();
    render(<Header {...baseProps} onOpenReport={onOpenReport} />);

    fireEvent.click(screen.getByTestId('header-management-summary-btn'));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
  });

  it('opens the executive brief from the more reports menu for public workspaces', () => {
    const onOpenReport = vi.fn();
    render(<Header {...baseProps} onOpenReport={onOpenReport} />);

    fireEvent.click(screen.getByTestId('header-more-reports-btn'));
    fireEvent.click(screen.getByTestId('header-executive-brief-btn'));

    expect(onOpenReport).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('header-more-reports-dropdown')).not.toBeInTheDocument();
  });

  it('keeps the management summary locked until the run is approved or proven, and reports locked without a delivery range', () => {
    const onOpenManagementBrief = vi.fn();
    const onOpenReport = vi.fn();
    const renderWith = (assessment: AssessmentRecord): void => {
      render(
        <Header
          {...baseProps}
          onOpenReport={onOpenReport}
          onOpenManagementBrief={onOpenManagementBrief}
          operatingMode={internalMode}
          activeAssessment={assessment}
        />
      );
    };

    // Net opportunity without a proven opportunity keeps the summary locked.
    renderWith(buildAssessment({ activeAnalysisRunId: 'RUN-1', status: 'ANALYST_REVIEW', netDefensibleOpportunityCr: 10 }));
    expect(screen.getByTestId('header-management-summary-btn')).toBeDisabled();
    fireEvent.click(screen.getByTestId('header-more-reports-btn'));
    expect(screen.getByTestId('no-reports-available')).toHaveTextContent(header.moreReportsUnavailable);
    fireEvent.click(screen.getByTestId('header-more-reports-btn'));
  });

  it('unlocks the management summary when net and proven opportunities are both positive', () => {
    const onOpenManagementBrief = vi.fn();
    const { unmount } = render(
      <Header
        {...baseProps}
        onOpenManagementBrief={onOpenManagementBrief}
        operatingMode={internalMode}
        activeAssessment={buildAssessment({
          activeAnalysisRunId: 'RUN-1',
          status: 'ANALYST_REVIEW',
          netDefensibleOpportunityCr: 10,
          provenOpportunityCr: 4,
          deliveryRangeMaxCr: 0
        })}
      />
    );

    fireEvent.click(screen.getByTestId('header-management-summary-btn'));
    expect(onOpenManagementBrief).toHaveBeenCalledTimes(1);

    // A zero delivery range does not unlock the reports menu.
    fireEvent.click(screen.getByTestId('header-more-reports-btn'));
    expect(screen.getByTestId('no-reports-available')).toBeInTheDocument();
    unmount();
  });

  it('unlocks the executive brief for a positive delivery range and the summary for approved runs', () => {
    const onOpenReport = vi.fn();
    const onOpenManagementBrief = vi.fn();
    const { unmount } = render(
      <Header
        {...baseProps}
        onOpenReport={onOpenReport}
        onOpenManagementBrief={onOpenManagementBrief}
        operatingMode={internalMode}
        activeAssessment={buildAssessment({
          activeAnalysisRunId: 'RUN-2',
          status: 'ANALYST_REVIEW',
          deliveryRangeMaxCr: 12
        })}
      />
    );

    expect(screen.getByTestId('header-management-summary-btn')).toBeDisabled();
    fireEvent.click(screen.getByTestId('header-more-reports-btn'));
    fireEvent.click(screen.getByTestId('header-executive-brief-btn'));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
    unmount();

    render(
      <Header
        {...baseProps}
        onOpenReport={onOpenReport}
        onOpenManagementBrief={onOpenManagementBrief}
        operatingMode={internalMode}
        activeAssessment={buildAssessment({ activeAnalysisRunId: 'RUN-3', status: 'APPROVED' })}
      />
    );
    fireEvent.click(screen.getByTestId('header-management-summary-btn'));
    expect(onOpenManagementBrief).toHaveBeenCalledTimes(1);
  });

  it('shows the assessment centre toggle only when a handler is supplied', () => {
    const onToggleAssessmentMode = vi.fn();
    const { unmount } = render(
      <Header
        {...baseProps}
        operatingMode={internalMode}
        activeAssessment={buildAssessment()}
        onToggleAssessmentMode={onToggleAssessmentMode}
      />
    );
    fireEvent.click(screen.getByTestId('header-assessment-centre-btn'));
    expect(onToggleAssessmentMode).toHaveBeenCalledTimes(1);
    unmount();

    render(<Header {...baseProps} operatingMode={internalMode} activeAssessment={buildAssessment()} />);
    expect(screen.queryByTestId('header-assessment-centre-btn')).not.toBeInTheDocument();
  });

  it('opens the client setup handler from the tenant badge when one is supplied', () => {
    const onOpenClientSetup = vi.fn();
    render(<Header {...baseProps} onOpenClientSetup={onOpenClientSetup} />);

    fireEvent.click(screen.getByTestId('tenant-badge'));
    expect(onOpenClientSetup).toHaveBeenCalledTimes(1);
  });

  it('shows the assessment status with underscores replaced when analysis has completed without acceptance', () => {
    render(
      <Header
        {...baseProps}
        operatingMode={internalMode}
        activeAssessment={buildAssessment({
          status: 'ANALYST_REVIEW',
          dataStatus: 'VALIDATED',
          activeDataVersionId: 'DV-2026-010',
          activeAnalysisRunId: 'RUN-2026-010',
          validatedSpendCr: 20
        })}
      />
    );

    expect(screen.getByTestId('assessment-status-badge')).toHaveTextContent('ANALYST REVIEW');
  });

  it('treats a current data version as an uploaded file for the awaiting validation badge', () => {
    render(
      <Header
        {...baseProps}
        operatingMode={internalMode}
        activeAssessment={buildAssessment({ currentDataVersionId: 'DV-2026-011', dataStatus: 'AWAITING_DATA' })}
      />
    );

    expect(screen.getByText(header.awaitingValidationBadge)).toBeInTheDocument();
  });
});
