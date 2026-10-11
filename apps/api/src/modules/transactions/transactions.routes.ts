import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePortfolioOwnerOrAdmin } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import {
  CreateTransactionSchema,
  ReverseTransactionSchema
} from './transactions.validation';
import { TransactionsController } from './transactions.controller';

export const transactionsRouter = Router();
export const portfolioTransactionsRouter = Router({ mergeParams: true });

// ------------------------------------------------------------------------------
// 1. Portfolio-scoped transaction routes (/api/v1/portfolios/:id/transactions)
// ------------------------------------------------------------------------------
portfolioTransactionsRouter.get(
  '/',
  requireAuth,
  TransactionsController.listByPortfolio
);

portfolioTransactionsRouter.post(
  '/',
  requireAuth,
  requirePortfolioOwnerOrAdmin,
  validateBody(CreateTransactionSchema),
  TransactionsController.createExpense
);

portfolioTransactionsRouter.post(
  '/:txId/reverse',
  requireAuth,
  requirePortfolioOwnerOrAdmin,
  validateBody(ReverseTransactionSchema),
  TransactionsController.reverseExpense
);

portfolioTransactionsRouter.delete(
  '/:txId',
  requireAuth,
  TransactionsController.rejectDelete
);

// ------------------------------------------------------------------------------
// 2. Global transaction routes (/api/v1/transactions)
// ------------------------------------------------------------------------------
transactionsRouter.get(
  '/',
  requireAuth,
  TransactionsController.listGlobal
);

transactionsRouter.delete(
  '/:id',
  requireAuth,
  TransactionsController.rejectDelete
);
