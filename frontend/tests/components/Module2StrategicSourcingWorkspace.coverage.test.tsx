/**
 * Coverage tests for Module2StrategicSourcingWorkspace.
 * Child lever views and strategy modals are replaced with stubs that expose the props the workspace passes
 * (assessment id, back/close callbacks, category selection). Each test drives one handler or render branch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import { Module2StrategicSourcingWorkspace } from '../../src/components/module2/Module2StrategicSourcingWorkspace';
import { Module2StrategicSourcingApi } from '../../src/utils/module2StrategicSourcingApi';
import { logger } from '../../src/utils/logger';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary
} from '../../src/types/module2StrategicSourcing';
import type { DirectPriceImprovementResult } from '../../src/types/module2DirectPriceImprovement';
import type { HowCalculatedData } from '../../src/components/module2/HowCalculatedModal';
import { buildSteelPlateCategoryProfile } from '../fixtures/module2CoverageFixtures';

vi.mock('../../src/components/module2/DirectPriceImprovementView', () => ({
  DirectPriceImprovementView: ({ assessmentId }: { assessmentId: string }) => (
    <section data-testid="stub-direct-price">{assessmentId}</section>
  )
}));

vi.mock('../../src/components/module2/EAuctionDynamicBiddingView', () => ({
  EAuctionDynamicBiddingView: ({ assessmentId, onBackToOverview }: { assessmentId: string; onBackToOverview?: () => void }) => (
    <section data-testid="stub-e-auction">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-e-auction-back" onClick={onBackToOverview} />
    </section>
  )
}));

vi.mock('../../src/components/module2/VendorConsolidationView', () => ({
  VendorConsolidationView: ({ assessmentId, onBackToOverview }: { assessmentId: string; onBackToOverview?: () => void }) => (
    <section data-testid="stub-vendor-consolidation">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-vendor-consolidation-back" onClick={onBackToOverview} />
    </section>
  )
}));

vi.mock('../../src/components/module2/VolumeAggregationView', () => ({
  VolumeAggregationView: ({ assessmentId, onBackToOverview }: { assessmentId: string; onBackToOverview?: () => void }) => (
    <section data-testid="stub-volume-aggregation">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-volume-aggregation-back" onClick={onBackToOverview} />
    </section>
  )
}));

vi.mock('../../src/components/module2/PaymentTermsView', () => ({
  PaymentTermsView: ({ assessmentId, onBackToOverview }: { assessmentId: string; onBackToOverview?: () => void }) => (
    <section data-testid="stub-payment-terms">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-payment-terms-back" onClick={onBackToOverview} />
    </section>
  )
}));

vi.mock('../../src/components/module2/CategorySpecialisationView', () => ({
  CategorySpecialisationView: ({ assessmentId, onBackToOverview }: { assessmentId: string; onBackToOverview?: () => void }) => (
    <section data-testid="stub-category-specialisation">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-category-specialisation-back" onClick={onBackToOverview} />
    </section>
  )
}));

vi.mock('../../src/components/module2/SpecificationRationalisationView', () => ({
  SpecificationRationalisationView: ({ assessmentId, onNavigateBack }: { assessmentId: string; onNavigateBack?: () => void }) => (
    <section data-testid="stub-spec-rationalisation">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-spec-rationalisation-back" onClick={onNavigateBack} />
    </section>
  )
}));

vi.mock('../../src/components/module2/ProcurementComplianceView', () => ({
  ProcurementComplianceView: ({ assessmentId, onNavigateBack }: { assessmentId: string; onNavigateBack?: () => void }) => (
    <section data-testid="stub-procurement-compliance">
      <span>{assessmentId}</span>
      <button type="button" data-testid="stub-procurement-compliance-back" onClick={onNavigateBack} />
    </section>
  )
}));

vi.mock('../../src/components/module2/AlternateSourcingView', () => ({
  AlternateSourcingView: ({ assessmentId }: { assessmentId: string }) => (
    <section data-testid="stub-alternate-sourcing">{assessmentId}</section>
  )
}));

vi.mock('../../src/components/module2/Module2ConsolidatedSavingsView', () => ({
  Module2ConsolidatedSavingsView: ({ assessmentId }: { assessmentId: string }) => (
    <section data-testid="stub-consolidated-savings">{assessmentId}</section>
  )
}));

vi.mock('../../src/components/module2/StrategicSourcingDashboardCards', () => ({
  StrategicSourcingDashboardCards: ({
    activeFilter,
    onFilterCardClick,
    onOpenHowCalculated
  }: {
    activeFilter: string;
    onFilterCardClick: (key: string) => void;
    onOpenHowCalculated: () => void;
  }) => (
    <section data-testid="stub-dashboard-cards" data-active-filter={activeFilter}>
      <button type="button" data-testid="stub-dashboard-filter" onClick={() => onFilterCardClick('CONSOLIDATION')} />
      <button type="button" data-testid="stub-dashboard-how" onClick={() => onOpenHowCalculated()} />
    </section>
  )
}));

vi.mock('../../src/components/module2/StrategicSourcingCategoryTable', () => ({
  StrategicSourcingCategoryTable: ({
    profiles,
    selectedCategoryName,
    onSelectCategory,
    onExportAudit,
    onOpenHowCalculated
  }: {
    profiles: CategoryStrategicSourcingProfile[];
    selectedCategoryName?: string;
    onSelectCategory: (profile: CategoryStrategicSourcingProfile) => void;
    onExportAudit: () => void;
    onOpenHowCalculated: (profile?: CategoryStrategicSourcingProfile | null) => void;
  }) => (
    <section data-testid="stub-category-table" data-selected-category={selectedCategoryName ?? ''}>
      {profiles.map((profile, index) => (
        <button
          key={profile.categoryId}
          type="button"
          data-testid={`stub-category-select-${index}`}
          onClick={() => onSelectCategory(profile)}
        />
      ))}
      <button type="button" data-testid="stub-category-export" onClick={() => onExportAudit()} />
      <button type="button" data-testid="stub-category-how" onClick={() => onOpenHowCalculated(profiles[0])} />
      <button type="button" data-testid="stub-category-how-empty" onClick={() => onOpenHowCalculated(null)} />
    </section>
  )
}));

vi.mock('../../src/components/module2/StrategicSourcingDeepDiveModal', () => ({
  StrategicSourcingDeepDiveModal: ({
    isOpen,
    profile,
    onClose,
    onHandoffToModule4,
    onOpenHowCalculated
  }: {
    isOpen: boolean;
    profile: CategoryStrategicSourcingProfile | null;
    onClose: () => void;
    onHandoffToModule4: (profile: CategoryStrategicSourcingProfile) => void;
    onOpenHowCalculated: (profile: CategoryStrategicSourcingProfile) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <section data-testid="stub-deep-dive" data-profile-id={profile?.categoryId}>
        <button type="button" data-testid="stub-deep-dive-close" onClick={onClose} />
        <button type="button" data-testid="stub-deep-dive-handoff" onClick={() => onHandoffToModule4(profile)} />
        <button type="button" data-testid="stub-deep-dive-how" onClick={() => onOpenHowCalculated(profile)} />
      </section>
    );
  }
}));

vi.mock('../../src/components/module2/HowCalculatedModal', () => ({
  HowCalculatedModal: ({
    isOpen,
    data,
    onClose
  }: {
    isOpen: boolean;
    data: HowCalculatedData | null;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <section data-testid="stub-how-calculated">
        <pre data-testid="stub-how-calculated-data">{JSON.stringify(data)}</pre>
        <button type="button" data-testid="stub-how-calculated-close" onClick={onClose} />
      </section>
    );
  }
}));

const SUMMARY: Module2StrategicSourcingDashboardSummary = {
  totalAddressableSpendInr: 15000000,
  totalAddressableSpendInrCr: 1.5,
  totalPotentialEAuctionOpportunityInr: 500000,
  totalPotentialEAuctionOpportunityInrCr: 0.05,
  totalPotentialConsolidationOpportunityInr: 200000,
  totalPotentialConsolidationOpportunityInrCr: 0.02,
  totalOverlappingOpportunityInr: 200000,
  totalOverlappingOpportunityInrCr: 0.02,
  netQuantifiableOpportunityInr: 500000,
  netQuantifiableOpportunityInrCr: 0.05,
  categoriesReadyForSourcingCount: 3,
  eauctionCandidatesCount: 2,
  consolidationCandidatesCount: 2,
  opportunitiesNotYetQuantifiableCount: 1,
  overallDataConfidence: 'HIGH',
  categoriesAnalyzedCount: 4,
  totalSpendAnalyzedInr: 18000000,
  totalSpendAnalyzedInrCr: 1.8,
  calculationTimestamp: '2026-09-29T12:00:00.000Z'
};

const PROFILE: CategoryStrategicSourcingProfile = buildSteelPlateCategoryProfile();
const SECOND_PROFILE: CategoryStrategicSourcingProfile = buildSteelPlateCategoryProfile({
  categoryId: 'CAT-ALU-SHEET-5MM',
  categoryName: 'Aluminium Sheets 5mm',
  calculationId: 'CALC-ALU-SHEET-0007'
});

const ASSESSMENT_ID = 'AIC-2026-0002';
const STORAGE_KEY = 'aicev_selected_assessment_id';
const createObjectUrlMock = vi.fn((): string => 'blob:module2-audit-dossier');

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushPromises(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

async function renderWorkspace(props: { assessmentId?: string } = {}): Promise<ReturnType<typeof render>> {
  const view = render(<Module2StrategicSourcingWorkspace {...props} />);
  await flushPromises();
  return view;
}

function getRefreshButton(): HTMLElement {
  const heading = screen.getByRole('heading', { name: UI_STRINGS.module2Sourcing.title });
  return within(heading.parentElement.parentElement).getByRole('button');
}

function readHowCalculatedData(): HowCalculatedData {
  const raw = screen.getByTestId('stub-how-calculated-data').textContent;
  const parsed: HowCalculatedData = JSON.parse(raw);
  return parsed;
}

function openStrategyTab(): void {
  fireEvent.click(screen.getByTestId('subtab-btn-strategy'));
}

async function openFirstCategoryDeepDive(): Promise<void> {
  openStrategyTab();
  fireEvent.click(screen.getByTestId('stub-category-select-0'));
  await flushPromises();
}

describe('Module2StrategicSourcingWorkspace coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Module2StrategicSourcingApi, 'getDashboardSummary').mockResolvedValue(SUMMARY);
    vi.spyOn(Module2StrategicSourcingApi, 'getCategoryProfiles').mockResolvedValue([PROFILE]);
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement').mockResolvedValue(null);
    vi.spyOn(Module2StrategicSourcingApi, 'getCategoryProfileById').mockResolvedValue(PROFILE);
    vi.spyOn(Module2StrategicSourcingApi, 'exportAuditDossier').mockResolvedValue({ dossierVersion: 'v1' });
    vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    createObjectUrlMock.mockClear();
    URL.createObjectURL = createObjectUrlMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('loading and header', () => {
    it('renders the header from UI_STRINGS and loads summary and profiles on mount', async () => {
      await renderWorkspace();

      expect(screen.getByRole('heading', { name: UI_STRINGS.module2Sourcing.title })).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module2Sourcing.noFabricationNotice, { exact: false })).toBeInTheDocument();
      expect(Module2StrategicSourcingApi.getDashboardSummary).not.toHaveBeenCalled();
      expect(Module2StrategicSourcingApi.getCategoryProfiles).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(UI_STRINGS.module2Sourcing.assessmentRequiredMessage);
    });

    it('reads the stored assessment id when no assessmentId prop is passed', async () => {
      localStorage.setItem(STORAGE_KEY, 'AIC-2026-0009');

      await renderWorkspace();

      expect(Module2StrategicSourcingApi.getDashboardSummary).toHaveBeenCalledWith(false, 'AIC-2026-0009');
      expect(Module2StrategicSourcingApi.getCategoryProfiles).toHaveBeenCalledWith(false, 'AIC-2026-0009');
      expect(Module2StrategicSourcingApi.getDirectPriceImprovement).toHaveBeenCalledWith('AIC-2026-0009');
    });

    it('renders the direct-price opportunity returned for the selected assessment', async () => {
      vi.mocked(Module2StrategicSourcingApi.getDirectPriceImprovement).mockResolvedValue({
        historicalLostOpportunityCr: 5
      } as unknown as DirectPriceImprovementResult);

      await renderWorkspace({ assessmentId: ASSESSMENT_ID });

      expect(await screen.findByText('₹5.00 Cr')).toBeInTheDocument();
      expect(Module2StrategicSourcingApi.getDirectPriceImprovement).toHaveBeenCalledWith(ASSESSMENT_ID);
    });

    it('reloads both datasets with refresh=true from the refresh control', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });

      fireEvent.click(getRefreshButton());
      await flushPromises();

      expect(Module2StrategicSourcingApi.getDashboardSummary).toHaveBeenLastCalledWith(true, ASSESSMENT_ID);
      expect(Module2StrategicSourcingApi.getCategoryProfiles).toHaveBeenLastCalledWith(true, ASSESSMENT_ID);
    });

    it('logs a summary load failure and still renders the strategy tab', async () => {
      vi.mocked(Module2StrategicSourcingApi.getDashboardSummary).mockRejectedValue(new Error('summary service offline'));

      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {}, expect.any(Error));
      expect(screen.queryByTestId('stub-dashboard-cards')).not.toBeInTheDocument();
      expect(screen.getByTestId('stub-category-table')).toBeInTheDocument();
    });

    it('omits the dashboard and categories when both API calls return nothing', async () => {
      vi.mocked(Module2StrategicSourcingApi.getDashboardSummary).mockResolvedValue(null);
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfiles).mockResolvedValue(null);

      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      expect(screen.queryByTestId('stub-dashboard-cards')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stub-category-select-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('stub-category-table')).toBeInTheDocument();
    });

    it('ignores responses that arrive after unmount', async () => {
      const summary = createDeferred<Module2StrategicSourcingDashboardSummary | null>();
      const profiles = createDeferred<CategoryStrategicSourcingProfile[]>();
      vi.mocked(Module2StrategicSourcingApi.getDashboardSummary).mockReturnValue(summary.promise);
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfiles).mockReturnValue(profiles.promise);

      const view = render(<Module2StrategicSourcingWorkspace assessmentId={ASSESSMENT_ID} />);
      view.unmount();
      await act(async () => {
        summary.resolve(SUMMARY);
        profiles.resolve([PROFILE]);
      });
      await flushPromises();

      expect(logger.error).not.toHaveBeenCalled();
    });

    it('ignores a load failure that arrives after unmount', async () => {
      const summary = createDeferred<Module2StrategicSourcingDashboardSummary | null>();
      vi.mocked(Module2StrategicSourcingApi.getDashboardSummary).mockReturnValue(summary.promise);

      const view = render(<Module2StrategicSourcingWorkspace assessmentId={ASSESSMENT_ID} />);
      view.unmount();
      await act(async () => {
        summary.reject(new Error('late failure'));
      });
      await flushPromises();

      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('lever tabs', () => {
    it('returns to the overview from the overview subtab button', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      fireEvent.click(screen.getByTestId('subtab-btn-directPrice'));
      expect(screen.getByTestId('stub-direct-price')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('subtab-btn-overview'));

      expect(screen.queryByTestId('stub-direct-price')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: UI_STRINGS.module2LeversOverview.pageTitle })).toBeInTheDocument();
    });

    it.each<[string, string]>([
      ['consolidatedSavings', 'stub-consolidated-savings'],
      ['directPrice', 'stub-direct-price'],
      ['eAuction', 'stub-e-auction'],
      ['vendorConsolidation', 'stub-vendor-consolidation'],
      ['volumeAggregation', 'stub-volume-aggregation'],
      ['paymentTerms', 'stub-payment-terms'],
      ['categorySpecialisation', 'stub-category-specialisation'],
      ['specificationRationalisation', 'stub-spec-rationalisation'],
      ['procurementCompliance', 'stub-procurement-compliance'],
      ['alternateSourcing', 'stub-alternate-sourcing']
    ])('opens the %s tab (%s) without inventing a default assessment id', async (tab, stubId) => {
      await renderWorkspace();

      fireEvent.click(screen.getByTestId(`subtab-btn-${tab}`));

      expect(screen.getByTestId(stubId).textContent).toBe('');
    });

    it.each<[string, string]>([
      ['consolidatedSavings', 'stub-consolidated-savings'],
      ['directPrice', 'stub-direct-price'],
      ['eAuction', 'stub-e-auction'],
      ['vendorConsolidation', 'stub-vendor-consolidation'],
      ['volumeAggregation', 'stub-volume-aggregation'],
      ['paymentTerms', 'stub-payment-terms'],
      ['categorySpecialisation', 'stub-category-specialisation'],
      ['specificationRationalisation', 'stub-spec-rationalisation'],
      ['procurementCompliance', 'stub-procurement-compliance'],
      ['alternateSourcing', 'stub-alternate-sourcing']
    ])('passes an explicit assessment id to the %s tab', async (tab, stubId) => {
      await renderWorkspace({ assessmentId: 'AIC-2026-0003' });

      fireEvent.click(screen.getByTestId(`subtab-btn-${tab}`));

      expect(screen.getByTestId(stubId)).toHaveTextContent('AIC-2026-0003');
    });

    it.each<[string, string, string]>([
      ['eAuction', 'stub-e-auction', 'stub-e-auction-back'],
      ['vendorConsolidation', 'stub-vendor-consolidation', 'stub-vendor-consolidation-back'],
      ['volumeAggregation', 'stub-volume-aggregation', 'stub-volume-aggregation-back'],
      ['paymentTerms', 'stub-payment-terms', 'stub-payment-terms-back'],
      ['categorySpecialisation', 'stub-category-specialisation', 'stub-category-specialisation-back'],
      ['specificationRationalisation', 'stub-spec-rationalisation', 'stub-spec-rationalisation-back'],
      ['procurementCompliance', 'stub-procurement-compliance', 'stub-procurement-compliance-back']
    ])('returns to the overview from the %s tab via %s', async (tab, stubId, backId) => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      fireEvent.click(screen.getByTestId(`subtab-btn-${tab}`));
      expect(screen.getByTestId(stubId)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId(backId));

      expect(screen.queryByTestId(stubId)).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: UI_STRINGS.module2LeversOverview.pageTitle })).toBeInTheDocument();
    });

    it.each<[string, string]>([
      ['1', 'stub-direct-price'],
      ['2', 'stub-e-auction'],
      ['3', 'stub-vendor-consolidation'],
      ['4', 'stub-volume-aggregation'],
      ['5', 'stub-payment-terms'],
      ['6', 'stub-category-specialisation'],
      ['8', 'stub-spec-rationalisation'],
      ['9', 'stub-procurement-compliance'],
      ['10', 'stub-alternate-sourcing']
    ])('opens the lever tab for overview card %s', async (leverId, stubId) => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });

      fireEvent.click(screen.getByTestId(`lever-open-btn-${leverId}`));

      expect(screen.getByTestId(stubId)).toBeInTheDocument();
    });
  });

  describe('strategy tab', () => {
    it('shows the dashboard cards and category table, with no deep dive or modal open', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });

      openStrategyTab();

      expect(screen.getByTestId('stub-dashboard-cards')).toBeInTheDocument();
      expect(screen.getByTestId('stub-category-table')).toHaveAttribute('data-selected-category', '');
      expect(screen.queryByTestId('stub-deep-dive')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stub-how-calculated')).not.toBeInTheDocument();
    });

    it('updates the active filter when a dashboard card is clicked', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-dashboard-filter'));

      expect(screen.getByTestId('stub-dashboard-cards')).toHaveAttribute('data-active-filter', 'CONSOLIDATION');
    });

    it('opens the deep dive for a selected category and closes it', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });

      await openFirstCategoryDeepDive();

      expect(Module2StrategicSourcingApi.getCategoryProfileById).toHaveBeenCalledWith(PROFILE.categoryId, ASSESSMENT_ID);
      expect(screen.getByTestId('stub-deep-dive')).toHaveAttribute('data-profile-id', PROFILE.categoryId);
      expect(screen.getByTestId('stub-category-table')).toHaveAttribute('data-selected-category', PROFILE.categoryName);

      fireEvent.click(screen.getByTestId('stub-deep-dive-close'));

      expect(screen.queryByTestId('stub-deep-dive')).not.toBeInTheDocument();
    });

    it('falls back to the category summary when the detailed profile is unavailable', async () => {
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfileById).mockResolvedValue(null);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });

      await openFirstCategoryDeepDive();

      expect(screen.getByTestId('stub-deep-dive')).toHaveAttribute('data-profile-id', PROFILE.categoryId);
    });

    it('ignores a detailed profile that resolves after the user selected another category', async () => {
      const firstProfile = createDeferred<CategoryStrategicSourcingProfile | null>();
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfiles).mockResolvedValue([PROFILE, SECOND_PROFILE]);
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfileById).mockImplementation((id: string) =>
        id === PROFILE.categoryId ? firstProfile.promise : Promise.resolve(SECOND_PROFILE)
      );
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-category-select-0'));
      fireEvent.click(screen.getByTestId('stub-category-select-1'));
      await flushPromises();
      await act(async () => {
        firstProfile.resolve(PROFILE);
      });
      await flushPromises();

      expect(screen.getByTestId('stub-deep-dive')).toHaveAttribute('data-profile-id', SECOND_PROFILE.categoryId);
    });

    it('discards a detailed profile that resolves after the assessment changes', async () => {
      const pending = createDeferred<CategoryStrategicSourcingProfile | null>();
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfileById).mockReturnValue(pending.promise);
      const view = await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();
      fireEvent.click(screen.getByTestId('stub-category-select-0'));

      view.rerender(<Module2StrategicSourcingWorkspace assessmentId="AIC-2026-0004" />);
      await flushPromises();
      await act(async () => {
        pending.resolve(PROFILE);
      });
      await flushPromises();

      expect(screen.queryByTestId('stub-deep-dive')).not.toBeInTheDocument();
    });

    it('does not load a category detail when no assessment is selected', async () => {
      await renderWorkspace();
      openStrategyTab();

      expect(screen.getByRole('alert')).toHaveTextContent(UI_STRINGS.module2Sourcing.assessmentRequiredMessage);
      expect(Module2StrategicSourcingApi.getCategoryProfiles).not.toHaveBeenCalled();
      expect(Module2StrategicSourcingApi.getCategoryProfileById).not.toHaveBeenCalled();
      expect(screen.queryByTestId('stub-deep-dive')).not.toBeInTheDocument();
    });

    it('opens the how-calculated modal from the dashboard using the first category', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-dashboard-how'));

      const data = readHowCalculatedData();
      expect(data.opportunityId).toBe(PROFILE.calculationId);
      expect(data.categoryName).toBe(PROFILE.categoryName);
      expect(data.opportunityType).toBe('E_AUCTION');
      expect(data.grossOpportunityInr).toBe(PROFILE.potentialEAuctionOpportunityInr + PROFILE.potentialVendorConsolidationOpportunityInr);
      expect(data.netOpportunityInr).toBe(PROFILE.netQuantifiableOpportunityInr);
      expect(data.overlapAdjustmentInr).toBe(PROFILE.overlappingOpportunityInr);
      expect(data.historicalReferencePrice).toBe(PROFILE.credibleReference.referencePrice);
      expect(data.priceDifferential).toBeCloseTo(
        PROFILE.priceDispersion.weightedAveragePrice - PROFILE.credibleReference.referencePrice,
        2
      );
    });

    it('uses the selected category for the dashboard how-calculated view once one is selected', async () => {
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfiles).mockResolvedValue([PROFILE, SECOND_PROFILE]);
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfileById).mockResolvedValue(SECOND_PROFILE);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      await openFirstCategoryDeepDive();

      fireEvent.click(screen.getByTestId('stub-dashboard-how'));

      expect(readHowCalculatedData().opportunityId).toBe(SECOND_PROFILE.calculationId);
    });

    it('opens how-calculated from the deep dive and from a category row, then closes it', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      await openFirstCategoryDeepDive();

      fireEvent.click(screen.getByTestId('stub-deep-dive-how'));
      expect(screen.getByTestId('stub-how-calculated')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('stub-how-calculated-close'));
      expect(screen.queryByTestId('stub-how-calculated')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('stub-category-how'));
      expect(readHowCalculatedData().opportunityId).toBe(PROFILE.calculationId);
    });

    it('falls back to the first category when a how-calculated request has no profile and nothing is selected', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-category-how-empty'));

      expect(readHowCalculatedData().opportunityId).toBe(PROFILE.calculationId);
    });

    it('does not open how-calculated when there are no categories to explain', async () => {
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfiles).mockResolvedValue([]);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-dashboard-how'));

      expect(screen.queryByTestId('stub-how-calculated')).not.toBeInTheDocument();
    });

    it.each<[string, number | undefined, number | undefined, number]>([
      ['only vendor consolidation is quantified', undefined, 500000, 500000],
      ['only e-auction is quantified', 300000, undefined, 300000]
    ])('computes how-calculated values when %s', async (_label, eAuction, consolidation, expectedGross) => {
      const sparse = buildSteelPlateCategoryProfile({
        primarySourcingLever: undefined,
        grossQuantifiableBenefitInr: 0,
        potentialEAuctionOpportunityInr: eAuction,
        potentialVendorConsolidationOpportunityInr: consolidation,
        overlappingOpportunityInr: undefined,
        netQuantifiableOpportunityInr: null,
        priceDispersion: null,
        credibleReference: null
      });
      vi.mocked(Module2StrategicSourcingApi.getCategoryProfileById).mockResolvedValue(sparse);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      await openFirstCategoryDeepDive();

      fireEvent.click(screen.getByTestId('stub-deep-dive-how'));

      const data = readHowCalculatedData();
      expect(data.opportunityType).toBe('E_AUCTION');
      expect(data.grossOpportunityInr).toBe(expectedGross);
      expect(data.overlapAdjustmentInr).toBe(0);
      expect(data.netOpportunityInr).toBe(0);
      expect(data.currentWeightedPrice).toBe(0);
      expect(data.historicalReferencePrice).toBe(0);
      expect(data.priceDifferential).toBe(0);
    });
  });

  describe('export audit dossier', () => {
    it('downloads the dossier as a JSON blob through the hidden anchor', async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-category-export'));

      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalledTimes(1);
      });
      expect(Module2StrategicSourcingApi.exportAuditDossier).toHaveBeenCalledWith(ASSESSMENT_ID);
      expect(createObjectUrlMock).toHaveBeenCalledWith(expect.any(Blob));
      const anchor = screen.getByRole('link', { hidden: true });
      expect(anchor).toHaveAttribute('href', 'blob:module2-audit-dossier');
      expect(anchor.getAttribute('download')).toMatch(/^MODULE_2_STRATEGIC_SOURCING_AUDIT_\d+\.json$/);
    });

    it('does not download when the dossier request returns no data', async () => {
      vi.mocked(Module2StrategicSourcingApi.exportAuditDossier).mockResolvedValue(null);
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-category-export'));
      await flushPromises();

      expect(createObjectUrlMock).not.toHaveBeenCalled();
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('logs an export failure', async () => {
      const failure = new Error('export gateway timeout');
      vi.mocked(Module2StrategicSourcingApi.exportAuditDossier).mockRejectedValue(failure);
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-category-export'));
      await flushPromises();

      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {}, failure);
    });

    it('does not request an export when no assessment is selected', async () => {
      await renderWorkspace();
      openStrategyTab();

      fireEvent.click(screen.getByTestId('stub-category-export'));
      await flushPromises();

      expect(Module2StrategicSourcingApi.exportAuditDossier).not.toHaveBeenCalled();
    });
  });

  describe('handoff to Module 4', () => {
    it('confirms the handoff, logs it, and lets the user dismiss the message', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      await openFirstCategoryDeepDive();

      fireEvent.click(screen.getByTestId('stub-deep-dive-handoff'));

      expect(logger.info).toHaveBeenCalledWith(expect.any(String), {
        categoryId: PROFILE.categoryId,
        opportunityId: PROFILE.calculationId
      });
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(PROFILE.categoryId);

      fireEvent.click(within(status).getByRole('button'));

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('clears the handoff confirmation after four seconds', async () => {
      await renderWorkspace({ assessmentId: ASSESSMENT_ID });
      await openFirstCategoryDeepDive();
      vi.useFakeTimers();

      fireEvent.click(screen.getByTestId('stub-deep-dive-handoff'));
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
