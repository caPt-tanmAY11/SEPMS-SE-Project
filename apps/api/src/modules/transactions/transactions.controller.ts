import { Request, Response, NextFunction } from 'express';
import { TransactionsService } from './transactions.service';

export class TransactionsController {
  /**
   * List transactions for a specific portfolio
   */
  static async listByPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const portfolioId = req.params.id;
      const { category, currency, search } = req.query;

      const transactions = await TransactionsService.listTransactions({
        portfolioId,
        category: category as string,
        currency: currency as string,
        search: search as string
      });

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List global transactions across all portfolios
   */
  static async listGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { portfolioId, category, currency, search } = req.query;

      const transactions = await TransactionsService.listTransactions({
        portfolioId: portfolioId as string,
        category: category as string,
        currency: currency as string,
        search: search as string
      });

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Record a new expense against a portfolio
   */
  static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const portfolioId = req.params.id;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const transaction = await TransactionsService.createExpense(
        portfolioId,
        req.body,
        actorId,
        ipAddress
      );

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Financial expense successfully recorded.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reverse an existing expense
   */
  static async reverseExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const portfolioId = req.params.id;
      const transactionId = req.params.txId;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const reversal = await TransactionsService.reverseExpense(
        portfolioId,
        transactionId,
        req.body,
        actorId,
        ipAddress
      );

      res.status(200).json({
        success: true,
        data: reversal,
        message: 'Transaction successfully reversed with justification.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Hard deletion is strictly prohibited by SEPMS audit & financial integrity rules
   */
  static async rejectDelete(req: Request, res: Response): Promise<void> {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({
      success: false,
      error: {
        code: 'TRANSACTION_DELETION_PROHIBITED',
        message:
          'Financial transactions represent immutable accounting history and cannot be deleted. To correct an entry, submit a linked reversal transaction with an audit justification.'
      }
    });
  }
}
