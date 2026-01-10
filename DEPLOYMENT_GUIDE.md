# Deployment Guide - Forms Platform

## Overview

This guide covers deploying the Forms Platform to Cloudflare Workers in both staging and production environments.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Node.js LTS (v18+)
- Git (optional)

## Initial Setup

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Configure Wrangler

Login to Cloudflare:
```bash
wrangler login
```

### 3. Create Cloudflare Resources

#### Option A: Automated (Recommended)
```bash
./scripts/create-resources.sh
```

#### Option B: Manual

**Create D1 Database:**
```bash
wrangler d1 create forms_platform_db
```

Copy the `database_id` from the output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "forms_platform_db"
database_id = "YOUR_DATABASE_ID_HERE"
```

**Apply Migrations:**
```bash
wrangler d1 execute forms_platform_db --file=../cf-workers-forms-platform/infra/migrations/001_init.sql
```

**Create R2 Bucket:**
```bash
wrangler r2 bucket create forms-platform-files
```

### 4. Set Environment Variables

Set secrets (if using custom auth):
```bash
wrangler secret put ADMIN_API_KEY --env staging
# Enter your API key when prompted
```

Optional Turnstile secret:
```bash
wrangler secret put TURNSTILE_SECRET --env staging
```

## Deployment

### Staging Deployment

1. **Build the application:**
```bash
npm run build
```

**Note:** You may see build warnings/errors related to @cloudflare/next-on-pages being deprecated. For now, you can proceed. The OpenNext adapter should be used in V1.

2. **Deploy to staging:**
```bash
wrangler deploy --env staging
```

3. **Verify deployment:**
The command will output your Worker URL:
```
Published forms-platform-staging (X.XX sec)
  https://forms-platform-staging.<your-subdomain>.workers.dev
```

4. **Test the deployment:**
```bash
curl https://forms-platform-staging.<your-subdomain>.workers.dev
```

### Production Deployment

1. **Create production resources:**

```bash
# D1 Database
wrangler d1 create forms_platform_db_prod

# Update wrangler.toml with production database_id

# Apply migrations
wrangler d1 execute forms_platform_db_prod --file=../cf-workers-forms-platform/infra/migrations/001_init.sql --env production

# R2 Bucket
wrangler r2 bucket create forms-platform-files-prod
```

2. **Set production secrets:**
```bash
wrangler secret put ADMIN_API_KEY --env production
```

3. **Deploy to production:**
```bash
npm run build
wrangler deploy --env production
```

## Seeding Data

### Seed the 5-Person Template

**Option 1: Via Script (requires local dev server)**
1. Start local development:
```bash
wrangler dev
```

2. In another terminal:
```bash
npx tsx scripts/seed.ts
```

**Option 2: Via API**
```bash
curl -X POST https://your-worker.workers.dev/api/admin/templates \
  -H "Content-Type: application/json" \
  -d @../cf-workers-forms-platform/templates/template_parent_data_5_people.json
```

Then publish the template:
```bash
curl -X POST https://your-worker.workers.dev/api/admin/templates/{TEMPLATE_ID}/publish \
  -H "Content-Type: application/json"
```

## Smoke Tests

### 1. Test Form Rendering
```bash
curl https://your-worker.workers.dev/f/{TEMPLATE_ID}
```

### 2. Test Submission API
```bash
curl -X POST https://your-worker.workers.dev/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TEMPLATE_ID",
    "language": "ar",
    "payload": {
      "person_slot": 1,
      "father_name_en": "John Doe",
      "father_pob": "New York, USA",
      "father_dob": "1980-01-01",
      "mother_name_en": "Jane Doe",
      "mother_pob": "London, UK",
      "mother_dob": "1982-05-15",
      "social_accounts": "https://twitter.com/johndoe"
    }
  }'
```

### 3. Test Admin Portal
Navigate to:
- https://your-worker.workers.dev/admin
- https://your-worker.workers.dev/admin/templates
- https://your-worker.workers.dev/admin/submissions?templateId={TEMPLATE_ID}

### 4. Test CSV Export
```bash
curl "https://your-worker.workers.dev/api/admin/exports/csv?templateId={TEMPLATE_ID}" \
  -o submissions.csv
```

## Monitoring

### View Logs
```bash
wrangler tail --env staging
```

### Check D1 Data
```bash
# List templates
wrangler d1 execute forms_platform_db --command "SELECT * FROM templates"

# List submissions
wrangler d1 execute forms_platform_db --command "SELECT * FROM submissions LIMIT 10"
```

### Check R2 Objects
```bash
wrangler r2 object list forms-platform-files
```

## Troubleshooting

### Build Errors
- Ensure you're using Node.js LTS (v18+)
- Clear `.next` and `node_modules`, then reinstall:
  ```bash
  rm -rf .next node_modules
  npm install
  npm run build
  ```

### Runtime Errors
- Check Wrangler logs: `wrangler tail`
- Verify D1 binding is correct in `wrangler.toml`
- Verify R2 bucket exists and binding is correct

### Database Issues
- Ensure migrations were applied successfully
- Check database ID matches in `wrangler.toml`

## Post-Deployment Checklist

- [ ] D1 database created and migrations applied
- [ ] R2 bucket created with private access
- [ ] Template seeded and published
- [ ] Form renders correctly at `/f/{token}`
- [ ] Submissions work end-to-end
- [ ] Admin portal accessible
- [ ] CSV export working
- [ ] Audit logs being written
- [ ] Person slot uniqueness enforced

## Security Notes

1. **Admin Protection:** Implement Cloudflare Access or custom authentication for `/admin/*` routes
2. **R2 Security:** Ensure R2 bucket is private (no public access)
3. **Rate Limiting:** Consider implementing rate limiting for public endpoints
4. **Secrets:** Never commit `.dev.vars` or expose API keys

## Next Steps (V1)

- Migrate to OpenNext adapter (replacing @cloudflare/next-on-pages)
- Implement Cloudflare Access for admin routes
- Add Turnstile for public forms
- Implement XLSX export
- Add attachment ZIP bundle export
- Implement notification webhooks
- Add dashboard analytics
