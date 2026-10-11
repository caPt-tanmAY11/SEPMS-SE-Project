import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRole, requirePortfolioOwnerOrAdmin } from '../../middleware/rbac';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  queryPortfoliosSchema
} from './portfolios.validation';
import { PortfolioService } from './portfolios.service';

const router = Router();

/**
 * GET /api/v1/portfolios
 * Universal Read Access: All authenticated users can list portfolios.
 */
router.get(
  '/',
  requireAuth,
  validateQuery(queryPortfoliosSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolios = await PortfolioService.listPortfolios(req.query as any);
      res.json({
        success: true,
        data: portfolios
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/portfolios/stats
 * Dashboard metrics derived from real persisted portfolios.
 */
router.get(
  '/stats',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await PortfolioService.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/portfolios/:id
 * Universal Read Access: All authenticated users can inspect details.
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await PortfolioService.getById(req.params.id);
      if (!portfolio) {
        res.status(404).json({
          success: false,
          error: {
            message: `Portfolio with ID '${req.params.id}' was not found.`,
            code: 'PORTFOLIO_NOT_FOUND'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/portfolios
 * Creates a portfolio. Restricted to PORTFOLIO_MANAGER and ADMIN.
 * Assigns creator as Portfolio Owner.
 */
router.post(
  '/',
  requireAuth,
  requireRole(['PORTFOLIO_MANAGER', 'ADMIN']),
  validateBody(createPortfolioSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await PortfolioService.createPortfolio(
        req.body,
        req.user!,
        req.ip
      );
      res.status(201).json({
        success: true,
        message: 'Portfolio created successfully.',
        data: created
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/portfolios/:id
 * Updates portfolio metadata. Restricted to Portfolio Owner or System Administrator.
 * Enforces optimistic concurrency control via version field.
 */
router.put(
  '/:id',
  requireAuth,
  requirePortfolioOwnerOrAdmin,
  validateBody(updatePortfolioSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await PortfolioService.updatePortfolio(
        req.params.id,
        req.body,
        req.user!,
        req.ip
      );
      res.json({
        success: true,
        message: 'Portfolio updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/portfolios/:id/archive
 * Archives a portfolio. Restricted to Portfolio Owner or System Administrator.
 */
router.post(
  '/:id/archive',
  requireAuth,
  requirePortfolioOwnerOrAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const archived = await PortfolioService.archivePortfolio(
        req.params.id,
        req.user!,
        req.ip
      );
      res.json({
        success: true,
        message: 'Portfolio archived successfully.',
        data: archived
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/portfolios/:id
 * Explicitly prohibited per Business Rule BR-03 and REQ-PORT-05.
 */
router.delete('/:id', (req: Request, res: Response) => {
  res.status(405).json({
    success: false,
    error: {
      message: 'Method Not Allowed: Hard deletion of portfolios is strictly prohibited to preserve historical integrity. Use POST /api/v1/portfolios/:id/archive instead.',
      code: 'PORTFOLIO_DELETION_PROHIBITED'
    }
  });
});

export default router;
