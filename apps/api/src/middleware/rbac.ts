import { Request, Response, NextFunction } from 'express';
import { query } from '../database/db';

/**
 * Middleware restricting access based on global application role.
 */
export function requireRole(allowedRoles: Array<'PORTFOLIO_MANAGER' | 'DEVELOPER' | 'EXECUTIVE' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', code: 'UNAUTHENTICATED' }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Forbidden. Role '${req.user.role}' is not authorized for this operation. Required: [${allowedRoles.join(', ')}].`,
          code: 'FORBIDDEN_ROLE'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Middleware verifying that the authenticated user is either the assigned
 * Portfolio Owner (in portfolio_memberships) or a System Administrator.
 */
export async function requirePortfolioOwnerOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required.', code: 'UNAUTHENTICATED' }
    });
    return;
  }

  // System Administrators have elevated maintenance privileges
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  const portfolioId = req.params.id;
  if (!portfolioId) {
    res.status(400).json({
      success: false,
      error: { message: 'Portfolio ID parameter missing.', code: 'BAD_REQUEST' }
    });
    return;
  }

  try {
    const membershipResult = await query(
      `SELECT role FROM public.portfolio_memberships 
       WHERE portfolio_id = $1 AND user_id = $2 AND role = 'OWNER'`,
      [portfolioId, req.user.id]
    );

    if (membershipResult.rows.length === 0) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden. Only the designated Portfolio Owner or a System Administrator may modify this portfolio.',
          code: 'NOT_PORTFOLIO_OWNER'
        }
      });
      return;
    }

    next();
  } catch (err: any) {
    console.error('[RBAC] Error verifying portfolio ownership:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to verify portfolio permissions.', code: 'INTERNAL_ERROR' }
    });
  }
}
