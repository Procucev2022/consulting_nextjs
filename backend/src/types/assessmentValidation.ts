import type { z } from 'zod';
import type {
  createCustomerSchema,
  updateCustomerSchema,
  createAssessmentSchema,
  updateNdaStatusSchema,
  updateDataStatusSchema,
  updateAssessmentStatusSchema,
  uploadDataVersionSchema,
  validateAssessmentDatasetSchema,
  analystApprovalSchema,
  deliverPackageSchema,
  assessmentDeliverySchema,
  assessmentAcceptanceSchema
} from '../constants/assessmentValidation';

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateNdaStatusInput = z.infer<typeof updateNdaStatusSchema>;
export type UpdateDataStatusInput = z.infer<typeof updateDataStatusSchema>;
export type UpdateAssessmentStatusInput = z.infer<typeof updateAssessmentStatusSchema>;
export type UploadDataVersionInput = z.infer<typeof uploadDataVersionSchema>;
export type ValidateAssessmentDatasetInput = z.infer<typeof validateAssessmentDatasetSchema>;
export type AnalystApprovalInput = z.infer<typeof analystApprovalSchema>;
export type DeliverPackageInput = z.infer<typeof deliverPackageSchema>;
export type AssessmentDeliveryInput = z.infer<typeof assessmentDeliverySchema>;
export type AssessmentAcceptanceInput = z.infer<typeof assessmentAcceptanceSchema>;
