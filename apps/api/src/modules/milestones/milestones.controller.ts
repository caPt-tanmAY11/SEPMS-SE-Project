import { Request, Response, NextFunction } from 'express';
import { MilestonesService } from './milestones.service';

export class MilestonesController {
  /**
   * List all milestones for a portfolio
   */
  static async listByPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const portfolioId = req.params.id;
      const milestones = await MilestonesService.listByPortfolio(portfolioId);
      res.status(200).json({
        success: true,
        data: milestones
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new milestone
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const portfolioId = req.params.id;
      const creatorId = req.user!.id;

      const milestone = await MilestonesService.createMilestone(portfolioId, req.body, creatorId);

      res.status(201).json({
        success: true,
        data: milestone,
        message: 'Milestone created successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update milestone status, actual date, or notes
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const portfolioId = req.params.id;
      const milestoneId = req.params.mId;
      const actorId = req.user!.id;

      const updated = await MilestonesService.updateMilestone(
        portfolioId,
        milestoneId,
        req.body,
        actorId
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Milestone updated successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Rejects DELETE requests with 405 Method Not Allowed
   */
  static async rejectDelete(req: Request, res: Response): Promise<void> {
    res.setHeader('Allow', 'GET, POST, PATCH');
    res.status(405).json({
      success: false,
      error: {
        code: 'MILESTONE_DELETION_PROHIBITED',
        message:
          'Milestones represent delivery baseline history and cannot be deleted. Update status to MISSED or modify schedule targets if scope has changed.'
      }
    });
  }
}
