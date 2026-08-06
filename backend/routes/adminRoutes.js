import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  createWord,
  updateWord,
  deleteWord,
  getReports
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);

router.post('/vocab', createWord);
router.put('/vocab/:id', updateWord);
router.delete('/vocab/:id', deleteWord);

router.get('/reports', getReports);

export default router;
