import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type EnvKey =
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'NEXT_PUBLIC_APP_URL'
  | 'TWILIO_ACCOUNT_SID'
  | 'TWILIO_AUTH_TOKEN'
  | 'TWILIO_VERIFY_SERVICE_SID'
  | 'ADMIN_PASSWORD';

type EnvCheck = {
  key: EnvKey;
  message: string;
};

const requiredEnv: EnvCheck[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    message: 'Set NEXT_PUBLIC_SUPABASE_URL to your Supabase project URL.',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    message: 'Set NEXT_PUBLIC_SUPABASE_ANON_KEY to your Supabase anon API key.',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    message: 'Set SUPABASE_SERVICE_ROLE_KEY to your Supabase service role key.',
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    message: 'Set NEXT_PUBLIC_APP_URL to the public URL of this deployment.',
  },
  {
    key: 'TWILIO_ACCOUNT_SID',
    message: 'Add TWILIO_ACCOUNT_SID from your Twilio console.',
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    message: 'Add TWILIO_AUTH_TOKEN from your Twilio console.',
  },
  {
    key: 'TWILIO_VERIFY_SERVICE_SID',
    message: 'Add TWILIO_VERIFY_SERVICE_SID for your Verify service.',
  },
  {
    key: 'ADMIN_PASSWORD',
    message: 'Set ADMIN_PASSWORD to secure the admin dashboard.',
  },
];

export async function GET() {
  const diagnostics: {
    server: string;
    timestamp: string;
    env: Record<
      EnvKey,
      | { status: 'configured' }
      | {
          status: 'missing';
          message: string;
        }
    >;
    database: {
      connection: 'unknown' | 'ok' | 'error';
      tables: string[];
      error?: string;
      migrationNeeded?: boolean;
      message?: string;
    };
  } = {
    server: 'ok',
    timestamp: new Date().toISOString(),
    env: {},
    database: {
      connection: 'unknown',
      tables: [] as string[],
    },
  };

  const missingEnv = requiredEnv.filter(({ key }) => !process.env[key]);

  diagnostics.env = requiredEnv.reduce<
    Record<
      EnvKey,
      | { status: 'configured' }
      | {
          status: 'missing';
          message: string;
        }
    >
  >((acc, { key, message }) => {
    acc[key] = process.env[key]
      ? { status: 'configured' }
      : { status: 'missing', message };
    return acc;
  }, {} as Record<EnvKey, { status: 'configured' } | { status: 'missing'; message: string }>);

  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        ...diagnostics,
        error: {
          message: 'Missing required environment variables. Update your deployment configuration and redeploy.',
          missing: missingEnv.map(({ key, message }) => ({ key, guidance: message })),
        },
      },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Test database connection
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      diagnostics.database.connection = 'error';
      diagnostics.database.error = error.message;

      // Check if it's a missing table error
      if (error.message.includes('relation "users" does not exist')) {
        diagnostics.database.migrationNeeded = true;
        diagnostics.database.message = 'Database tables not found. Run the migration in Supabase.';
      }
    } else {
      diagnostics.database.connection = 'ok';
      diagnostics.database.tables = ['users', 'nominations', 'endorsements', 'messages'];
    }
  } catch (err: any) {
    diagnostics.database.connection = 'error';
    diagnostics.database.error = err.message;
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.database.connection === 'ok' ? 200 : 500,
  });
}
