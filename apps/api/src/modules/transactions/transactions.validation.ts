import { z } from 'zod';

export const TransactionCategoryEnum = z.enum([
  'INFRASTRUCTURE',
  'VENDOR',
  'LABOR',
  'SOFTWARE_LICENSING',
  'OTHER_PROJECT_EXPENSE'
]);

export const CurrencyEnum = z.enum(['USD', 'EUR', 'GBP', 'INR']);

export const CreateTransactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  currency: CurrencyEnum,
  category: TransactionCategoryEnum,
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date must be in YYYY-MM-DD format'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  justification: z.string().max(1000).optional()
});

export const ReverseTransactionSchema = z.object({
  justification: z.string().min(5, 'A justification of at least 5 characters is required for a financial reversal').max(1000)
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
export type ReverseTransactionDto = z.infer<typeof ReverseTransactionSchema>;
