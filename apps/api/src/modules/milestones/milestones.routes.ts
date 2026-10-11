import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePortfolioOwnerOrAdmin } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import {
  CreateMilestoneSchema,
  UpdateMilestoneSchema
} from './milestones.validation';
import { MilestonesController } from './milestones.controller';

export const portfolioMilestonesRouter = Router({ mergeParams: true });

portfolioMilestonesRouter.get(
  '/',
  requireAuth,
  MilestonesController.listByPortfolio
);

portfolioMilestonesRouter.post(
  '/',
  requireAuth,
  requirePortfolioOwnerOrAdmin,
  validateBody(CreateMilestoneSchema),
  MilestonesController.create
);

portfolioMilestonesRouter.patch(
  '/:mId',
  requireAuth,
  requirePortfolioOwnerOrAdmin,
  validateBody(UpdateMilestoneSchema),
  MilestonesController.update
);

portfolioMilestonesRouter.delete(
  '/:mId',
  requireAuth,
  MilestonesController.rejectDelete
);
