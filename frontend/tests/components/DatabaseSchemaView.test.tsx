import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatabaseSchemaView } from '../../src/components/DatabaseSchemaView';
import { schemaEntities } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { dbApiClient } from '../../src/utils/dbApi';

vi.mock('../../src/utils/dbApi', () => ({
  dbApiClient: { getDBSchema: vi.fn(async () => schemaEntities.map((entity) => ({ ...entity, ddl: `CREATE TABLE ${entity.entity_name} (id TEXT);` }))) }
}));

describe('DatabaseSchemaView Component', () => {
  it('shows actionable feedback if the D1 schema cannot be loaded', async () => {
    vi.mocked(dbApiClient.getDBSchema).mockRejectedValueOnce(new Error('D1 unavailable'));
    render(<DatabaseSchemaView />);
    expect(screen.getByRole('status')).toHaveTextContent(UI_STRINGS.databaseData.loadingSchema);
    expect(await screen.findByRole('alert')).toHaveTextContent(UI_STRINGS.databaseData.schemaLoadFailed);
  });
  it('renders correctly with default selected entity and tabs', async () => {
    render(<DatabaseSchemaView />);
    await screen.findByText(UI_STRINGS.schema.bannerTitle);

    expect(screen.getByText(UI_STRINGS.schema.bannerTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.entitiesHeader)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.performanceTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.queryTelemetry)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.readCache)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.securityTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.encryptionDescription)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.complianceDescription)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.uptimeTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.availabilityDescription)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.recoveryDescription)).toBeInTheDocument();
  });

  it('cycles through all entities and updates displayed DDL, attributes, and preview', async () => {
    render(<DatabaseSchemaView />);
    await screen.findByText(UI_STRINGS.schema.bannerTitle);

    const ddlTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.schema.tabs.sqlDdl, 'i') });
    const jsonTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.schema.tabs.sampleData, 'i') });
    const attrTab = screen.getByRole('button', { name: new RegExp(UI_STRINGS.schema.tabs.attributes, 'i') });

    // Test each entity selection
    for (const entity of schemaEntities) {
      const entityBtn = screen.getAllByText(entity.entity_name)[0];
      fireEvent.click(entityBtn);

      // Check Attributes tab
      fireEvent.click(attrTab);
      expect(screen.getByText(UI_STRINGS.schema.primaryAttributesLabel)).toBeInTheDocument();

      // Check SQL DDL tab
      fireEvent.click(ddlTab);
      expect(screen.getByText(/CREATE TABLE/i)).toBeInTheDocument();

      // Check JSON Preview tab
      fireEvent.click(jsonTab);
    }
  });
});
