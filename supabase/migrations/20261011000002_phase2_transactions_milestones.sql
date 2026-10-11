-- ==============================================================================
-- SEPMS Migration: Phase 2 Transactions & Milestones Schema
-- Tables: financial_transactions, milestones
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Financial Transactions
-- Records expenses and offsetting reversals with strict referential integrity
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'INR')),
    category TEXT NOT NULL CHECK (category IN (
        'INFRASTRUCTURE', 
        'VENDOR', 
        'LABOR', 
        'SOFTWARE_LICENSING', 
        'OTHER_PROJECT_EXPENSE'
    )),
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL CHECK (length(trim(description)) > 0),
    justification TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (transaction_type IN ('EXPENSE', 'REVERSAL')),
    reversed_transaction_id UUID REFERENCES public.financial_transactions(id),
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    actor_id UUID NOT NULL REFERENCES public.user_profiles(id),
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON public.financial_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_actor ON public.financial_transactions(actor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_reversed_ref ON public.financial_transactions(reversed_transaction_id);

-- ------------------------------------------------------------------------------
-- 2. Milestones
-- Records delivery milestones, target dates, completion dates, and status
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    target_date DATE NOT NULL,
    actual_date DATE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED')),
    notes TEXT DEFAULT '',
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_portfolio ON public.milestones(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON public.milestones(target_date);

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Read policy: Any authenticated user can read all transactions & milestones
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.financial_transactions;
CREATE POLICY "Authenticated users can view transactions"
ON public.financial_transactions FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view milestones" ON public.milestones;
CREATE POLICY "Authenticated users can view milestones"
ON public.milestones FOR SELECT
TO authenticated
USING (true);

-- Write policies: Only Portfolio Owner or Admin can insert/update
DROP POLICY IF EXISTS "Portfolio Owners and Admins can insert transactions" ON public.financial_transactions;
CREATE POLICY "Portfolio Owners and Admins can insert transactions"
ON public.financial_transactions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN'
    ) OR EXISTS (
        SELECT 1 FROM public.portfolio_memberships 
        WHERE portfolio_id = financial_transactions.portfolio_id 
          AND user_id = auth.uid() 
          AND role = 'OWNER'
    )
);

DROP POLICY IF EXISTS "Portfolio Owners and Admins can insert milestones" ON public.milestones;
CREATE POLICY "Portfolio Owners and Admins can insert milestones"
ON public.milestones FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN'
    ) OR EXISTS (
        SELECT 1 FROM public.portfolio_memberships 
        WHERE portfolio_id = milestones.portfolio_id 
          AND user_id = auth.uid() 
          AND role = 'OWNER'
    )
);
