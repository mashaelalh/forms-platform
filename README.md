# Forms Platform - Cloudflare Workers

Bilingual (Arabic/English) forms platform built with Next.js on Cloudflare Workers.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create local environment file:
```bash
cp .dev.vars.example .dev.vars
```

3. Create local D1 database:
```bash
npx wrangler d1 create forms_platform_db_local
```

4. Update `wrangler.toml` with the database ID

5. Apply migrations:
```bash
npx wrangler d1 execute forms_platform_db_local --local --file=../cf-workers-forms-platform/infra/migrations/001_init.sql
```

6. Create R2 bucket:
```bash
npx wrangler r2 bucket create forms-platform-files-local
```

7. Run development server:
```bash
npm run dev
```

## Deployment

### Staging

1. Create D1 database:
```bash
npx wrangler d1 create forms_platform_db
```

2. Update `wrangler.toml` with database ID

3. Apply migrations:
```bash
npx wrangler d1 execute forms_platform_db --file=../cf-workers-forms-platform/infra/migrations/001_init.sql
```

4. Create R2 bucket:
```bash
npx wrangler r2 bucket create forms-platform-files
```

5. Deploy:
```bash
npm run deploy:staging
```

### Production

Similar to staging, but use production environment in wrangler.toml.

## API Endpoints

### Public
- `GET /f/[token]` - Form renderer
- `POST /api/submissions` - Submit form
- `POST /api/uploads/presign` - Get presigned upload URL
- `POST /api/submissions/[id]/files/confirm` - Confirm file upload

### Admin
- `GET /api/admin/templates` - List templates
- `POST /api/admin/templates` - Create template
- `GET /api/admin/templates/[id]` - Get template
- `PUT /api/admin/templates/[id]` - Update template
- `POST /api/admin/templates/[id]/publish` - Publish template
- `GET /api/admin/exports/csv?templateId=...` - Export CSV

## Seeding Data

To seed the 5-person template:

```bash
node scripts/seed.js
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Cloudflare Workers
- D1 (SQL Database)
- R2 (Object Storage)
- @cloudflare/next-on-pages
