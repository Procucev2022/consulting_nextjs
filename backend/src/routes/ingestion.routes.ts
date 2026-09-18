import { Router } from 'express';
import {
  getIngestionData,
  addIngestionFile,
  updateValidationRecord,
  resetValidationRecords,
  applyBlanketRemediation,
  uploadDocumentToObjectStore,
  getStoredObject,
  deleteIngestionDocument
} from '../controllers/ingestion.controller';
import { validateBody } from '../utils/validation';
import { addIngestionFileSchema, updateValidationRecordSchema } from '../constants/validation';

const router = Router();

router.get('/', getIngestionData);
router.post('/', validateBody(addIngestionFileSchema), addIngestionFile);
router.post('/upload', uploadDocumentToObjectStore);
router.get('/storage/:key', getStoredObject);
router.patch('/', validateBody(updateValidationRecordSchema), updateValidationRecord);
router.delete('/', resetValidationRecords);
router.delete('/document', deleteIngestionDocument);
router.delete('/document/:docId', deleteIngestionDocument);
router.post('/remediate', applyBlanketRemediation);

export default router;
