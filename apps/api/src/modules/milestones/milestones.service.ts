import { query } from '../../database/db';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.validation';

export interface MilestoneRecord {
  id: string;
  portfolio_id: string;
  name: string;
  target_date: string;
  actual_date: string | null;
  status: 'PENDING' | 'COMPLETED' | 'MISSED';
  notes: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export class MilestonesService {
  /**
   * Helper to determine if a milestone is overdue
   */
  private static computeIsOverdue(targetDate: string, status: string): boolean {
    if (status !== 'PENDING') return false;
    const today = new Date().toISOString().split('T')[0];
    return targetDate < today;
  }

  /**
   * List milestones for a given portfolio
   */
  static async listByPortfolio(portfolioId: string): Promise<MilestoneRecord[]> {
    const sql = `
      SELECT 
        m.*, 
        u.full_name as creator_name
      FROM public.milestones m
      JOIN public.user_profiles u ON m.created_by = u.id
      WHERE m.portfolio_id = $1
      ORDER BY m.target_date ASC
    `;

    const res = await query<MilestoneRecord>(sql, [portfolioId]);
    return res.rows.map((row) => ({
      ...row,
      is_overdue: this.computeIsOverdue(row.target_date, row.status)
    }));
  }

  /**
   * Create a new milestone for a portfolio
   */
  static async createMilestone(
    portfolioId: string,
    dto: CreateMilestoneDto,
    creatorId: string
  ): Promise<MilestoneRecord> {
    // 1. Check portfolio
    const pRes = await query(`SELECT id, status FROM public.portfolios WHERE id = $1`, [portfolioId]);
    const portfolio = pRes.rows[0];

    if (!portfolio) {
      const err: any = new Error(`Portfolio with ID '${portfolioId}' was not found.`);
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (portfolio.status === 'ARCHIVED') {
      const err: any = new Error(`Cannot add milestones to an archived portfolio.`);
      err.status = 400;
      err.code = 'PORTFOLIO_ARCHIVED';
      throw err;
    }

    // 2. If status is COMPLETED and actualDate is omitted, default to today
    let actualDate = dto.actualDate || null;
    if (dto.status === 'COMPLETED' && !actualDate) {
      actualDate = new Date().toISOString().split('T')[0];
    }

    // 3. Insert milestone
    const insertSql = `
      INSERT INTO public.milestones (
        portfolio_id,
        name,
        target_date,
        actual_date,
        status,
        notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      portfolioId,
      dto.name.trim(),
      dto.targetDate,
      actualDate,
      dto.status,
      dto.notes?.trim() || '',
      creatorId
    ];

    const insertRes = await query<MilestoneRecord>(insertSql, params);
    const created = insertRes.rows[0];

    // 4. Audit Log
    await query(
      `
      INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        'MILESTONE',
        created.id,
        'MILESTONE_CREATED',
        creatorId,
        JSON.stringify({ name: dto.name, target_date: dto.targetDate, status: dto.status })
      ]
    );

    return {
      ...created,
      is_overdue: this.computeIsOverdue(created.target_date, created.status)
    };
  }

  /**
   * Update an existing milestone (status transition, actual date, notes)
   */
  static async updateMilestone(
    portfolioId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
    actorId: string
  ): Promise<MilestoneRecord> {
    // 1. Fetch milestone
    const mRes = await query<MilestoneRecord>(
      `SELECT * FROM public.milestones WHERE id = $1`,
      [milestoneId]
    );
    const milestone = mRes.rows[0];

    if (!milestone) {
      const err: any = new Error(`Milestone with ID '${milestoneId}' was not found.`);
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (milestone.portfolio_id !== portfolioId) {
      const err: any = new Error(`Milestone '${milestoneId}' does not belong to portfolio '${portfolioId}'.`);
      err.status = 400;
      err.code = 'PORTFOLIO_MISMATCH';
      throw err;
    }

    // 2. Check portfolio
    const pRes = await query(`SELECT id, status FROM public.portfolios WHERE id = $1`, [portfolioId]);
    if (pRes.rows[0]?.status === 'ARCHIVED') {
      const err: any = new Error(`Cannot update milestones on an archived portfolio.`);
      err.status = 400;
      err.code = 'PORTFOLIO_ARCHIVED';
      throw err;
    }

    // 3. Resolve status & actualDate
    const newStatus = dto.status || milestone.status;
    let newActualDate = dto.actualDate !== undefined ? dto.actualDate : milestone.actual_date;

    if (newStatus === 'COMPLETED' && !newActualDate) {
      newActualDate = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'PENDING' || newStatus === 'MISSED') {
      // If moving away from completed, reset actual date unless explicitly provided
      if (dto.actualDate === undefined && milestone.status === 'COMPLETED') {
        newActualDate = null;
      }
    }

    const newNotes = dto.notes !== undefined ? dto.notes.trim() : milestone.notes;

    // 4. Update milestone
    const updateSql = `
      UPDATE public.milestones
      SET status = $1, actual_date = $2, notes = $3
      WHERE id = $4
      RETURNING *
    `;

    const updateRes = await query<MilestoneRecord>(updateSql, [
      newStatus,
      newActualDate,
      newNotes,
      milestoneId
    ]);

    const updated = updateRes.rows[0];

    // 5. Audit Log
    await query(
      `
      INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        'MILESTONE',
        milestoneId,
        'MILESTONE_UPDATED',
        actorId,
        JSON.stringify({
          fromStatus: milestone.status,
          toStatus: newStatus,
          actualDate: newActualDate
        })
      ]
    );

    return {
      ...updated,
      is_overdue: this.computeIsOverdue(updated.target_date, updated.status)
    };
  }
}
