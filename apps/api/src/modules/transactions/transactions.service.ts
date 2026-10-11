import { query } from '../../database/db';
import { CreateTransactionDto, ReverseTransactionDto } from './transactions.validation';

export interface FinancialTransactionRecord {
  id: string;
  portfolio_id: string;
  amount: string | number;
  currency: string;
  category: string;
  transaction_date: string;
  description: string;
  justification: string | null;
  transaction_type: 'EXPENSE' | 'REVERSAL';
  reversed_transaction_id: string | null;
  is_reversed: boolean;
  actor_id: string;
  actor_name?: string;
  portfolio_name?: string;
  ip_address: string | null;
  created_at: string;
}

export class TransactionsService {
  /**
   * List all transactions, optionally filtered by portfolio, category, currency
   */
  static async listTransactions(filters: {
    portfolioId?: string;
    category?: string;
    currency?: string;
    search?: string;
  } = {}): Promise<FinancialTransactionRecord[]> {
    let sql: string;
    let params: any[] = [];

    if (filters.portfolioId) {
      sql = `
        SELECT 
          t.*, 
          u.full_name as actor_name, 
          p.name as portfolio_name
        FROM public.financial_transactions t
        JOIN public.user_profiles u ON t.actor_id = u.id
        JOIN public.portfolios p ON t.portfolio_id = p.id
        WHERE t.portfolio_id = $1
        ORDER BY t.transaction_date DESC, t.created_at DESC
      `;
      params = [filters.portfolioId];
    } else {
      sql = `
        SELECT 
          t.*, 
          u.full_name as actor_name, 
          p.name as portfolio_name
        FROM public.financial_transactions t
        JOIN public.user_profiles u ON t.actor_id = u.id
        JOIN public.portfolios p ON t.portfolio_id = p.id
        ORDER BY t.transaction_date DESC, t.created_at DESC
      `;
    }

    const res = await query<FinancialTransactionRecord>(sql, params);
    let results = res.rows;

    if (filters.category) {
      results = results.filter((tx) => tx.category === filters.category);
    }
    if (filters.currency) {
      results = results.filter((tx) => tx.currency === filters.currency);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          (tx.justification && tx.justification.toLowerCase().includes(q)) ||
          (tx.portfolio_name && tx.portfolio_name.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * Retrieve a single transaction by ID
   */
  static async getTransactionById(id: string): Promise<FinancialTransactionRecord | null> {
    const res = await query<FinancialTransactionRecord>(
      `
      SELECT 
        t.*, 
        u.full_name as actor_name, 
        p.name as portfolio_name
      FROM public.financial_transactions t
      JOIN public.user_profiles u ON t.actor_id = u.id
      JOIN public.portfolios p ON t.portfolio_id = p.id
      WHERE t.id = $1
      `,
      [id]
    );

    return res.rows[0] || null;
  }

  /**
   * Record a new expense transaction against a portfolio
   */
  static async createExpense(
    portfolioId: string,
    dto: CreateTransactionDto,
    actorId: string,
    ipAddress?: string
  ): Promise<FinancialTransactionRecord> {
    // 1. Verify portfolio exists and is active
    const pRes = await query(
      `SELECT id, currency, status, name FROM public.portfolios WHERE id = $1`,
      [portfolioId]
    );
    const portfolio = pRes.rows[0];

    if (!portfolio) {
      const err: any = new Error(`Portfolio with ID '${portfolioId}' was not found.`);
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (portfolio.status === 'ARCHIVED') {
      const err: any = new Error(`Cannot record transactions on an archived portfolio.`);
      err.status = 400;
      err.code = 'PORTFOLIO_ARCHIVED';
      throw err;
    }

    // 2. Currency check
    if (portfolio.currency !== dto.currency) {
      const err: any = new Error(
        `Currency mismatch: Portfolio '${portfolio.name}' is denominated in ${portfolio.currency}, but transaction requested in ${dto.currency}. Cross-currency aggregation without configured conversion is prohibited.`
      );
      err.status = 400;
      err.code = 'CURRENCY_MISMATCH';
      throw err;
    }

    // 3. Insert transaction
    const insertSql = `
      INSERT INTO public.financial_transactions (
        portfolio_id,
        amount,
        currency,
        category,
        transaction_date,
        description,
        justification,
        transaction_type,
        reversed_transaction_id,
        is_reversed,
        actor_id,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const txParams = [
      portfolioId,
      dto.amount.toFixed(2),
      dto.currency,
      dto.category,
      dto.transactionDate,
      dto.description.trim(),
      dto.justification ? dto.justification.trim() : null,
      'EXPENSE',
      null,
      false,
      actorId,
      ipAddress || null
    ];

    const insertRes = await query<FinancialTransactionRecord>(insertSql, txParams);
    const createdTx = insertRes.rows[0];

    // 4. Audit Log
    await query(
      `
      INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        'FINANCIAL_TRANSACTION',
        createdTx.id,
        'EXPENSE_RECORDED',
        actorId,
        JSON.stringify({ amount: dto.amount, category: dto.category, description: dto.description }),
        ipAddress || null
      ]
    );

    return createdTx;
  }

  /**
   * Reverse an existing expense transaction with a justification
   */
  static async reverseExpense(
    portfolioId: string,
    transactionId: string,
    dto: ReverseTransactionDto,
    actorId: string,
    ipAddress?: string
  ): Promise<FinancialTransactionRecord> {
    // 1. Fetch original transaction
    const originalRes = await query<FinancialTransactionRecord>(
      `SELECT * FROM public.financial_transactions WHERE id = $1`,
      [transactionId]
    );
    const original = originalRes.rows[0];

    if (!original) {
      const err: any = new Error(`Transaction with ID '${transactionId}' was not found.`);
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (original.portfolio_id !== portfolioId) {
      const err: any = new Error(`Transaction '${transactionId}' does not belong to portfolio '${portfolioId}'.`);
      err.status = 400;
      err.code = 'PORTFOLIO_MISMATCH';
      throw err;
    }

    if (original.transaction_type === 'REVERSAL') {
      const err: any = new Error(`Cannot reverse a reversal transaction.`);
      err.status = 400;
      err.code = 'INVALID_REVERSAL_TARGET';
      throw err;
    }

    if (original.is_reversed) {
      const err: any = new Error(`Transaction '${transactionId}' has already been reversed.`);
      err.status = 409;
      err.code = 'ALREADY_REVERSED';
      throw err;
    }

    // 2. Mark original transaction as is_reversed = true
    await query(
      `UPDATE public.financial_transactions SET is_reversed = TRUE WHERE id = $1 RETURNING *`,
      [transactionId]
    );

    // 3. Create linked reversal entry
    const today = new Date().toISOString().split('T')[0];
    const reversalDescription = `Reversal: ${original.description}`;

    const insertSql = `
      INSERT INTO public.financial_transactions (
        portfolio_id,
        amount,
        currency,
        category,
        transaction_date,
        description,
        justification,
        transaction_type,
        reversed_transaction_id,
        is_reversed,
        actor_id,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const reversalParams = [
      portfolioId,
      Number(original.amount).toFixed(2),
      original.currency,
      original.category,
      today,
      reversalDescription,
      dto.justification.trim(),
      'REVERSAL',
      original.id,
      false,
      actorId,
      ipAddress || null
    ];

    const reversalRes = await query<FinancialTransactionRecord>(insertSql, reversalParams);
    const reversalTx = reversalRes.rows[0];

    // 4. Audit Log
    await query(
      `
      INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        'FINANCIAL_TRANSACTION',
        reversalTx.id,
        'EXPENSE_REVERSED',
        actorId,
        JSON.stringify({
          original_transaction_id: original.id,
          amount: original.amount,
          justification: dto.justification
        }),
        ipAddress || null
      ]
    );

    return reversalTx;
  }
}
