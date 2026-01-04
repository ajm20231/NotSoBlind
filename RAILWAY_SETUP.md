# Railway Deployment Setup

## Environment Variables to Set in Railway

Go to your Railway project settings and add these environment variables:

### Production Environment

```bash
# Twilio
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_VERIFY_SERVICE_SID=<your-twilio-verify-service-sid>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
NEXT_PUBLIC_ENV=production

# Admin
ADMIN_PASSWORD=<set-secure-password>
```

### Staging/PR Preview Environments

Use the same values but set:
```bash
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_APP_URL=${{ RAILWAY_PUBLIC_DOMAIN }}
```

## PR Preview Setup

1. Go to Railway project → Settings
2. Under "Environments" create a `staging` environment
3. Enable "Deploy on PR"
4. Railway will automatically comment on PRs with preview URLs

## Health check

Set the service health check path to `/api/health` in Railway (Project → Settings → Deployments → Health Checks). This endpoint validates that Supabase environment variables are present and tests database connectivity so deployments fail fast when the database cannot be reached.

## Custom Domain (Optional)

1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` env var
