import { Router } from 'express';
import {
  getIngestionData,
  addIngestionFile,
  updateValidationRecord,
  resetValidationRecords,
  applyBlanketRemediation
} from '../controllers/ingestion.controller';
import { validateBody } from '../utils/validation';
import { addIngestionFileSchema, updateValidationRecordSchema } from '../constants/validation';

const router = Router();

router.get('/', getIngestionData);
router.post('/', validateBody(addIngestionFileSchema), addIngestionFile);
router.patch('/', validateBody(updateValidationRecordSchema), updateValidationRecord);
router.delete('/', resetValidationRecords);
router.post('/remediate', applyBlanketRemediation);

export default router;
