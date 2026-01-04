import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

type EnvCheck = {
  key: string;
  description: string;
};

const REQUIRED_ENV_VARS: EnvCheck[] = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anon public API key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
  { key: 'TWILIO_ACCOUNT_SID', description: 'Twilio Account SID' },
  { key: 'TWILIO_AUTH_TOKEN', description: 'Twilio Auth Token' },
  { key: 'TWILIO_VERIFY_SERVICE_SID', description: 'Twilio Verify Service SID' },
  { key: 'NEXT_PUBLIC_APP_URL', description: 'Publicly accessible app URL' },
  { key: 'ADMIN_PASSWORD', description: 'Admin dashboard password' },
];

function getEnvDiagnostics() {
  const details: Record<string, 'configured' | 'missing'> = {};
  const missing: string[] = [];

  REQUIRED_ENV_VARS.forEach(({ key, description }) => {
    const value = process.env[key];
    const present = Boolean(value && value.trim() !== '');
    details[key] = present ? 'configured' : 'missing';

    if (!present) {
      missing.push(`${key} (${description}) is not set. Add this to your environment variables.`);
    }
  });

  return { details, missing };
}

export async function GET() {
  const envDiagnostics = getEnvDiagnostics();
  const diagnostics: {
    server: string;
    timestamp: string;
    issues: string[];
    env: {
      status: 'ok' | 'error';
      details: Record<string, 'configured' | 'missing'>;
      missing: string[];
    };
    database: {
      connection: 'ok' | 'error' | 'unknown' | 'skipped';
      tables: string[];
      error?: string;
      message?: string;
      migrationNeeded?: boolean;
    };
  } = {
    server: 'ok',
    timestamp: new Date().toISOString(),
    issues: [] as string[],
    env: {
      status: envDiagnostics.missing.length === 0 ? 'ok' : 'error',
      details: envDiagnostics.details,
      missing: envDiagnostics.missing,
    },
    database: {
      connection: envDiagnostics.missing.length === 0 ? 'unknown' : 'skipped',
      tables: [] as string[],
    },
  };

  if (envDiagnostics.missing.length > 0) {
    diagnostics.issues.push(
      'Missing required environment variables. Configure the variables listed in env.missing before deployment.'
    );
  } else {
    // Test database connection only when required env vars are present
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        diagnostics.database.connection = 'error';
        diagnostics.database.error = error.message;

        if (error.message.includes('relation "users" does not exist')) {
          diagnostics.database.migrationNeeded = true;
          diagnostics.database.message =
            'Database tables not found. Run the migration in Supabase (supabase/migrations/20260104000000_initial_schema.sql).';
        }

        diagnostics.issues.push(
          'Supabase connection failed. Verify database migrations and service role credentials.'
        );
      } else {
        diagnostics.database.connection = 'ok';
        diagnostics.database.tables = ['users', 'nominations', 'endorsements', 'messages'];
      }
    } catch (err: any) {
      diagnostics.database.connection = 'error';
      diagnostics.database.error = err.message;
      diagnostics.issues.push(
        'Supabase client initialization failed. Confirm Supabase environment variables are set correctly.'
      );
    }
  }

  const statusCode = diagnostics.issues.length > 0 ? 500 : 200;

  return NextResponse.json(diagnostics, {
    status: statusCode,
  });
}
