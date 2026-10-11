import { z } from 'zod';

export const createPortfolioSchema = z.object({
  name: z.string().trim().min(2, 'Portfolio name must be at least 2 characters').max(150),
  description: z.string().max(1000).default(''),
  targetBudget: z.coerce.number().positive('Target budget must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR'], {
    errorMap: () => ({ message: 'Currency must be one of USD, EUR, GBP, or INR' })
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  initialMembers: z.array(
    z.object({
      userId: z.string().uuid('Invalid member user ID'),
      role: z.enum(['CONTRIBUTOR']).default('CONTRIBUTOR')
    })
  ).optional().default([]),
  assets: z.array(
    z.object({
      name: z.string().min(1, 'Asset name is required'),
      type: z.enum(['REPOSITORY', 'BOARD_EPIC', 'DOCUMENTATION']),
      url: z.string().url('Asset URL must be a valid URL'),
      externalId: z.string().optional()
    })
  ).optional().default([])
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

export const updatePortfolioSchema = z.object({
  name: z.string().trim().min(2, 'Portfolio name must be at least 2 characters').max(150),
  description: z.string().max(1000).default(''),
  targetBudget: z.coerce.number().positive('Target budget must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  version: z.number().int().positive('Version is required for optimistic concurrency control')
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate']
});

export const queryPortfoliosSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'ARCHIVED']).optional().default('ALL'),
  sort: z.enum(['name', 'created_at', 'target_budget', 'start_date']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type QueryPortfoliosInput = z.infer<typeof queryPortfoliosSchema>;
