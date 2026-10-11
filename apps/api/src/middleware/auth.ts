import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { query, isUsingMockDb, mockState } from '../database/db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  employeeId?: string;
  role: 'PORTFOLIO_MANAGER' | 'DEVELOPER' | 'EXECUTIVE' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

let supabaseClient: any = null;
if (config.supabase.url && config.supabase.anonKey) {
  supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

const DEMO_TOKEN_MAP: Record<string, string> = {
  'test-pm-token': '00000000-0000-0000-0000-000000000001',
  'test-dev-token': '00000000-0000-0000-0000-000000000002',
  'test-exec-token': '00000000-0000-0000-0000-000000000003',
  'test-admin-token': '00000000-0000-0000-0000-000000000004'
};

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Missing or malformed Authorization Bearer header.',
        code: 'UNAUTHENTICATED'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1].trim();

  // 1. Support offline test & demo tokens
  if (DEMO_TOKEN_MAP[token]) {
    const demoUserId = DEMO_TOKEN_MAP[token];
    const user = mockState.userProfiles.find((u) => u.id === demoUserId);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        department: user.department,
        employeeId: user.employee_id,
        role: user.role
      };
      next();
      return;
    }
  }

  // 2. Offline mock token if Supabase credentials are not yet configured
  if (isUsingMockDb() && token.startsWith('demo-')) {
    const email = token.replace('demo-', '');
    const user = mockState.userProfiles.find((u) => u.email === email);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        department: user.department,
        employeeId: user.employee_id,
        role: user.role
      };
      next();
      return;
    }
  }

  // 3. Live Supabase Auth verification
  if (!supabaseClient) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid session token or Supabase Auth service not configured.',
        code: 'INVALID_TOKEN'
      }
    });
    return;
  }

  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !authData?.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Session invalid or expired. Please sign in again.',
          code: 'INVALID_TOKEN'
        }
      });
      return;
    }

    const authUserId = authData.user.id;

    // Load application profile and role from PostgreSQL database
    const profileResult = await query(
      'SELECT id, email, full_name, department, employee_id, role FROM public.user_profiles WHERE id = $1',
      [authUserId]
    );

    if (profileResult.rows.length === 0) {
      // If profile does not exist yet, initialize default DEVELOPER profile
      const email = authData.user.email || 'unknown@domain.local';
      const fullName = authData.user.user_metadata?.full_name || email.split('@')[0];
      const defaultRole = 'DEVELOPER';

      const insertResult = await query(
        `INSERT INTO public.user_profiles (id, email, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
         RETURNING id, email, full_name, department, employee_id, role`,
        [authUserId, email, fullName, defaultRole]
      );

      const newProfile = insertResult.rows[0];
      req.user = {
        id: newProfile.id,
        email: newProfile.email,
        fullName: newProfile.full_name,
        department: newProfile.department,
        employeeId: newProfile.employee_id,
        role: newProfile.role
      };
    } else {
      const profile = profileResult.rows[0];
      req.user = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        department: profile.department,
        employeeId: profile.employee_id,
        role: profile.role
      };
    }

    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Verification error:', err);
    res.status(401).json({
      success: false,
      error: {
        message: 'Failed to verify authentication credentials.',
        code: 'AUTH_VERIFICATION_FAILED'
      }
    });
  }
}
