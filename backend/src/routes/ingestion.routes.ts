import { Router } from 'express';
import {
  getIngestionData,
  addIngestionFile,
  updateValidationRecord,
  resetValidationRecords,
  applyBlanketRemediation
} from '../controllers/ingestion.controller';

const router = Router();

router.get('/', getIngestionData);
router.post('/', addIngestionFile);
router.patch('/', updateValidationRecord);
router.delete('/', resetValidationRecords);
router.post('/remediate', applyBlanketRemediation);

export default router;
