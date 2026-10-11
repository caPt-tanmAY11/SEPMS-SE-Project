-- ==============================================================================
-- SEPMS Migration: Phase 1 Initial Schema
-- Tables: user_profiles, portfolios, portfolio_memberships, se_assets, audit_logs
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. User Profiles
-- Linked to Supabase Auth identities via auth.users(id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    department TEXT DEFAULT 'Engineering',
    employee_id TEXT,
    role TEXT NOT NULL DEFAULT 'DEVELOPER' CHECK (role IN ('PORTFOLIO_MANAGER', 'DEVELOPER', 'EXECUTIVE', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ------------------------------------------------------------------------------
-- 2. Portfolios
-- Represents a software engineering portfolio/project container
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT NOT NULL DEFAULT '',
    target_budget NUMERIC(15, 2) NOT NULL CHECK (target_budget >= 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'INR')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_portfolio_dates CHECK (end_date >= start_date)
);

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_portfolios_status ON public.portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_by ON public.portfolios(created_by);
CREATE INDEX IF NOT EXISTS idx_portfolios_dates ON public.portfolios(start_date, end_date);

-- ------------------------------------------------------------------------------
-- 3. Portfolio Memberships
-- Junction table mapping users to portfolios with specific roles (Owner, Contributor)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'CONTRIBUTOR')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_portfolio_user_membership UNIQUE (portfolio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_portfolio ON public.portfolio_memberships(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.portfolio_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON public.portfolio_memberships(role);

-- ------------------------------------------------------------------------------
-- 4. SE Assets (Software Engineering Assets)
-- Linked code repositories (GitHub/GitLab), Jira Epics, Documentation
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.se_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('REPOSITORY', 'BOARD_EPIC', 'DOCUMENTATION')),
    url TEXT NOT NULL,
    external_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_se_assets_portfolio ON public.se_assets(portfolio_id);

-- ------------------------------------------------------------------------------
-- 5. Audit Logs
-- Immutable audit log for portfolio mutations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES public.user_profiles(id),
    changes JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.se_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies:
-- Any authenticated user can view profiles
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.user_profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile; admins can update any profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Portfolios Policies:
-- Universal Read Access: Any authenticated user can read all portfolios
DROP POLICY IF EXISTS "Portfolios viewable by all authenticated users" ON public.portfolios;
CREATE POLICY "Portfolios viewable by all authenticated users"
ON public.portfolios FOR SELECT
TO authenticated
USING (true);

-- Only Portfolio Managers or Admins can insert portfolios
DROP POLICY IF EXISTS "Portfolio creation restricted to managers and admins" ON public.portfolios;
CREATE POLICY "Portfolio creation restricted to managers and admins"
ON public.portfolios FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('PORTFOLIO_MANAGER', 'ADMIN')
    )
);

-- Only Portfolio Owners or Admins can update portfolios
DROP POLICY IF EXISTS "Portfolio update restricted to owner or admin" ON public.portfolios;
CREATE POLICY "Portfolio update restricted to owner or admin"
ON public.portfolios FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.portfolio_memberships
        WHERE portfolio_id = portfolios.id AND user_id = auth.uid() AND role = 'OWNER'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Notice: No DELETE policy is created. Deletion is forbidden by BR-03 and REQ-PORT-05.

-- Portfolio Memberships Policies:
DROP POLICY IF EXISTS "Memberships viewable by all authenticated users" ON public.portfolio_memberships;
CREATE POLICY "Memberships viewable by all authenticated users"
ON public.portfolio_memberships FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Memberships mutable by portfolio owner or admin" ON public.portfolio_memberships;
CREATE POLICY "Memberships mutable by portfolio owner or admin"
ON public.portfolio_memberships FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.portfolio_memberships pm
        WHERE pm.portfolio_id = portfolio_memberships.portfolio_id AND pm.user_id = auth.uid() AND pm.role = 'OWNER'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- SE Assets Policies:
DROP POLICY IF EXISTS "Assets viewable by all authenticated users" ON public.se_assets;
CREATE POLICY "Assets viewable by all authenticated users"
ON public.se_assets FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Assets mutable by portfolio owner or admin" ON public.se_assets;
CREATE POLICY "Assets mutable by portfolio owner or admin"
ON public.se_assets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.portfolio_memberships
        WHERE portfolio_id = se_assets.portfolio_id AND user_id = auth.uid() AND role = 'OWNER'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Audit Logs Policies:
DROP POLICY IF EXISTS "Audit logs viewable by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by authenticated users"
ON public.audit_logs FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Audit logs insertable by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated users"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
