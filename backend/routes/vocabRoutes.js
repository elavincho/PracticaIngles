import express from 'express';
import { getVocabulary, getCategories, recordActivityScore } from '../controllers/vocabController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getVocabulary);
router.get('/categories', getCategories);
router.post('/progress', protect, recordActivityScore);

export default router;
