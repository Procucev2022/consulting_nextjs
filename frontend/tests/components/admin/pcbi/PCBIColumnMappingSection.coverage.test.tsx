import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PCBIColumnMappingSection } from '../../../../src/components/admin/pcbi/PCBIColumnMappingSection';
import { UI_STRINGS } from '../../../../src/constants';
import { PCBI_TARGET_FIELDS, PCBI_WORKSHEET_PURPOSE_LABELS } from '../../../../src/constants/pcbiAdmin';
import type { PCBIColumnMapping } from '../../../../src/types/pcbiAdmin';

const UNREGISTERED_DATASET = 'UNREGISTERED_DATASET';

const buildMapping = (overrides: Partial<PCBIColumnMapping> = {}): PCBIColumnMapping => ({
  excelColumn: 'Source Code',
  mappedField: '',
  fieldLabel: 'Unmapped',
  isRequired: false,
  confidence: 45,
  status: 'OPTIONAL',
  sampleValues: ['SRC-01'],
  ...overrides
});

describe('PCBIColumnMappingSection coverage', () => {
  it('shows the raw dataset key and no target fields when a dataset is not registered', () => {
    render(
      <PCBIColumnMappingSection
        mappings={{ [UNREGISTERED_DATASET]: [buildMapping()] }}
        selectedSheetForMapping={UNREGISTERED_DATASET}
        onSelectSheetForMapping={vi.fn()}
        onOverrideColumnMapping={vi.fn()}
      />
    );

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.columnMappingTitle)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: UNREGISTERED_DATASET })).toBeInTheDocument();
    expect(screen.getByText('Source Code')).toBeInTheDocument();

    const [, mappingSelect] = screen.getAllByRole('combobox');
    expect(within(mappingSelect).getAllByRole('option')).toHaveLength(1);
  });

  it('renders no mapping rows when the selected dataset has no mappings', () => {
    render(
      <PCBIColumnMappingSection
        mappings={{ PCBI_MASTER: [buildMapping({ excelColumn: 'Unique Source Column' })] }}
        selectedSheetForMapping="WEEKLY_INDEX"
        onSelectSheetForMapping={vi.fn()}
        onOverrideColumnMapping={vi.fn()}
      />
    );

    expect(screen.queryByText('Unique Source Column')).not.toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.excelColHeader)).toBeInTheDocument();
  });

  it('lists the registered target fields and reports dataset and column changes', () => {
    const onSelectSheet = vi.fn();
    const onOverrideColumn = vi.fn();
    const masterLabel = PCBI_WORKSHEET_PURPOSE_LABELS.PCBI_MASTER;
    const targetFields = PCBI_TARGET_FIELDS.PCBI_MASTER;

    render(
      <PCBIColumnMappingSection
        mappings={{
          PCBI_MASTER: [buildMapping({ excelColumn: 'PCBI ID', mappedField: 'pcbi_id', status: 'MAPPED', confidence: 95 })],
          WEEKLY_INDEX: [buildMapping({ excelColumn: 'Index Date' })]
        }}
        selectedSheetForMapping="PCBI_MASTER"
        onSelectSheetForMapping={onSelectSheet}
        onOverrideColumnMapping={onOverrideColumn}
      />
    );

    expect(screen.getByRole('option', { name: masterLabel })).toBeInTheDocument();

    const [datasetSelect, mappingSelect] = screen.getAllByRole('combobox');
    expect(within(mappingSelect).getAllByRole('option')).toHaveLength(targetFields.length + 1);

    fireEvent.change(datasetSelect, { target: { value: 'WEEKLY_INDEX' } });
    expect(onSelectSheet).toHaveBeenCalledWith('WEEKLY_INDEX');

    fireEvent.change(mappingSelect, { target: { value: targetFields[1].field } });
    expect(onOverrideColumn).toHaveBeenCalledWith('PCBI_MASTER', 'PCBI ID', targetFields[1].field);
  });
});
