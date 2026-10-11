import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile and application role
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.user
  });
});

export default router;
