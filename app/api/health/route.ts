import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const diagnostics: any = {
    server: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      twilioSid: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      adminPassword: process.env.ADMIN_PASSWORD ? 'configured' : 'missing',
    },
    database: {
      connection: 'unknown',
      tables: [] as string[],
    },
  };

  // Test database connection
  try {
    const supabase = getSupabaseClient();
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
