import express from 'express';
import { register, login, getProfile, updateProfile, getLeaderboard } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/leaderboard', getLeaderboard);

export default router;
