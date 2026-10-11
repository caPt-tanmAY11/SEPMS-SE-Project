import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth';
import { query } from '../../database/db';

const router = Router();

/**
 * GET /api/v1/users
 * Returns list of user profiles for member assignment in portfolios
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, department, employee_id, role
       FROM public.user_profiles
       ORDER BY full_name ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

export default router;
