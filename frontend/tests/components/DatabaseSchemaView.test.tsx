import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatabaseSchemaView } from '../../src/components/DatabaseSchemaView';
import { schemaEntities } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('DatabaseSchemaView Component', () => {
  it('renders correctly with default selected entity and tabs', () => {
    render(<DatabaseSchemaView />);

    expect(screen.getByText(UI_STRINGS.schema.bannerTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.entitiesHeader)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.performanceTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.securityTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.schema.slaCards.uptimeTitle)).toBeInTheDocument();
  });

  it('cycles through all entities and updates displayed DDL, attributes, and preview', () => {
    render(<DatabaseSchemaView />);

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
