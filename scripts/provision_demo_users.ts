/**
 * SEPMS Server-Side Demo User Provisioning Script
 * 
 * Provisions the standard persona accounts via Supabase Auth Admin API
 * and initializes their application roles in public.user_profiles.
 * 
 * Usage:
 *   npx ts-node scripts/provision_demo_users.ts
 * 
 * Requirements:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your server environment.
 *   NEVER expose this script or its credentials to the browser client.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('Please configure your server environment variables before running this script.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface DemoUser {
  email: string;
  password: string;
  fullName: string;
  department: string;
  employeeId: string;
  role: 'PORTFOLIO_MANAGER' | 'DEVELOPER' | 'EXECUTIVE' | 'ADMIN';
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'pm@sepms.local',
    password: 'Password123!',
    fullName: 'Alex Vance (Portfolio Manager)',
    department: 'Software Engineering PMO',
    employeeId: 'EMP-1001',
    role: 'PORTFOLIO_MANAGER'
  },
  {
    email: 'dev@sepms.local',
    password: 'Password123!',
    fullName: 'Devon Lee (Senior Developer)',
    department: 'Core Platform Engineering',
    employeeId: 'EMP-1002',
    role: 'DEVELOPER'
  },
  {
    email: 'exec@sepms.local',
    password: 'Password123!',
    fullName: 'Elena Rostova (VP of Engineering)',
    department: 'Executive Leadership',
    employeeId: 'EMP-1003',
    role: 'EXECUTIVE'
  },
  {
    email: 'admin@sepms.local',
    password: 'Password123!',
    fullName: 'Sam Altman (System Administrator)',
    department: 'IT Operations',
    employeeId: 'EMP-1004',
    role: 'ADMIN'
  }
];

async function provision() {
  console.log('--- SEPMS Demo User Provisioning Started ---');

  for (const user of DEMO_USERS) {
    console.log(`\nProvisioning: ${user.email} (${user.role})...`);

    // 1. Create or retrieve auth user
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName
      }
    });

    let userId: string;

    if (createError) {
      if (createError.message.includes('already exists') || createError.message.includes('already been registered')) {
        console.log(`User ${user.email} already exists in auth. Fetching user ID...`);
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users.find((u) => u.email === user.email);
        if (!existing) {
          console.error(`Could not locate existing auth record for ${user.email}`);
          continue;
        }
        userId = existing.id;
      } else {
        console.error(`Failed to create auth user ${user.email}:`, createError.message);
        continue;
      }
    } else {
      userId = createData.user.id;
      console.log(`Auth user created: ${userId}`);
    }

    // 2. Upsert user_profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        email: user.email,
        full_name: user.fullName,
        department: user.department,
        employee_id: user.employeeId,
        role: user.role
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`Failed to upsert profile for ${user.email}:`, profileError.message);
    } else {
      console.log(`Profile successfully synced for ${user.email} with role [${user.role}].`);
    }
  }

  console.log('\n--- Provisioning Completed ---');
  console.log('Demo Credentials:');
  DEMO_USERS.forEach((u) => {
    console.log(`- ${u.role}: ${u.email} / ${u.password}`);
  });
}

provision().catch((err) => {
  console.error('Fatal error during provisioning:', err);
  process.exit(1);
});
