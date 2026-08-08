import express from 'express';
import { getVocabulary, getCategories, recordActivityScore, recordWordFail } from '../controllers/vocabController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getVocabulary);
router.get('/categories', getCategories);
router.post('/progress', protect, recordActivityScore);
router.post('/fail-word', recordWordFail);

export default router;
