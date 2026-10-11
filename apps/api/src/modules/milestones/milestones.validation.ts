import { z } from 'zod';

export const MilestoneStatusEnum = z.enum(['PENDING', 'COMPLETED', 'MISSED']);

export const CreateMilestoneSchema = z.object({
  name: z.string().min(3, 'Milestone name must be at least 3 characters').max(200),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format'),
  actualDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Actual date must be in YYYY-MM-DD format').nullable().optional(),
  status: MilestoneStatusEnum.default('PENDING'),
  notes: z.string().max(1000).optional().default('')
});

export const UpdateMilestoneSchema = z.object({
  status: MilestoneStatusEnum.optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format').optional(),
  actualDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Actual date must be in YYYY-MM-DD format').nullable().optional(),
  notes: z.string().max(1000).optional()
}).refine(
  (data) => {
    // If marking as COMPLETED without an explicit actualDate, we'll auto-stamp today in service
    return true;
  }
);

export type CreateMilestoneDto = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneDto = z.infer<typeof UpdateMilestoneSchema>;
