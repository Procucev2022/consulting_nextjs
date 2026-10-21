/**
 * Module 2 — Lever 10: Alternate Sourcing Controller Unit Tests
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { Module2AlternateSourcingController } from '../../src/controllers/module2AlternateSourcing.controller';
import { Module2AlternateSourcingEngine } from '../../src/services/module2AlternateSourcingEngine';
import type { AlternateSourcingResult } from '../../src/types/module2AlternateSourcing';

describe('Module2AlternateSourcingController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  const mockResult: AlternateSourcingResult = {
    assessmentId: 'AIC-2026-0001',
    summary: {
      totalEligibleMaterials: 10,
      singleSourceMaterialsCount: 2,
      totalPotentialVendorsAllLocations: 500,
      totalPotentialVendorsPreferredRegion: 50,
      totalCurrentSuppliersExcluded: 1,
      overallDistinctVendorPoolEstimate: 614864,
      potentialFinancialSavingsInr: 0,
      potentialFinancialSavingsCr: 0,
      isDiscoveryOnly: true
    },
    opportunities: [],
    availableStates: ['MAHARASHTRA'],
    availableCities: ['MUMBAI'],
    disclosures: []
  };

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      query: {
        assessmentId: 'AIC-2026-0001'
      }
    };
    mockRes = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json']
    };
  });

  it('handles valid GET /alternate-sourcing request and returns 200 with discovery results', async () => {
    vi.spyOn(Module2AlternateSourcingEngine, 'calculateAlternateSourcing').mockReturnValueOnce(mockResult);

    await Module2AlternateSourcingController.getAlternateSourcing(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: mockResult
    });
  });

  it('rejects invalid query parameters with 400 Bad Request', async () => {
    mockReq.query = {
      geographicPreference: 'INVALID_PREFERENCE'
    };

    await Module2AlternateSourcingController.getAlternateSourcing(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid query parameters')
      })
    );
  });

  it('handles internal calculation errors and returns 500 with structured response', async () => {
    vi.spyOn(Module2AlternateSourcingEngine, 'calculateAlternateSourcing').mockImplementationOnce(() => {
      throw new Error('Database disk fault');
    });

    await Module2AlternateSourcingController.getAlternateSourcing(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Internal error')
      })
    );
  });
});
