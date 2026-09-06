import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatabaseSchemaView } from '../../src/components/DatabaseSchemaView';
import { schemaEntities } from '../../src/data/mockData';

describe('DatabaseSchemaView Component', () => {
  it('renders correctly with default selected entity and tabs', () => {
    render(<DatabaseSchemaView />);

    expect(screen.getByText('Data Architecture & Security SLA Specifications')).toBeInTheDocument();
    expect(screen.getByText('Database Core Entities (6)')).toBeInTheDocument();
    expect(screen.getByText('System Performance SLA')).toBeInTheDocument();
    expect(screen.getByText('Security & Global Compliance')).toBeInTheDocument();
    expect(screen.getByText('System Uptime & Failover')).toBeInTheDocument();
  });

  it('cycles through all entities and updates displayed DDL, attributes, and preview', () => {
    render(<DatabaseSchemaView />);

    const ddlTab = screen.getByRole('button', { name: /SQL DDL/i });
    const jsonTab = screen.getByRole('button', { name: /JSON Preview/i });
    const attrTab = screen.getByRole('button', { name: /Attributes/i });

    // Test each entity selection
    for (const entity of schemaEntities) {
      const entityBtn = screen.getAllByText(entity.entity_name)[0];
      fireEvent.click(entityBtn);

      // Check Attributes tab
      fireEvent.click(attrTab);
      expect(screen.getByText('Primary Attributes / Fields:')).toBeInTheDocument();

      // Check SQL DDL tab
      fireEvent.click(ddlTab);
      expect(screen.getByText(/CREATE TABLE/i)).toBeInTheDocument();

      // Check JSON Preview tab
      fireEvent.click(jsonTab);
    }
  });
});
