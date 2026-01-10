# 🚀 Deploy Your Forms Platform Now

## Step-by-Step Deployment Guide

### Prerequisites Check
✅ Node.js installed (v18+)
✅ Wrangler CLI installed
⚠️ **You need:** Cloudflare account + Wrangler login

---

## 1. Login to Cloudflare

```bash
wrangler login
```

This will:
- Open your browser
- Ask you to authorize Wrangler
- Save your credentials locally

**⚠️ You must complete this before continuing!**

---

## 2. Create D1 Database

```bash
wrangler d1 create forms_platform_db
```

**Expected output:**
```
✅ Successfully created DB 'forms_platform_db'!

[[d1_databases]]
binding = "DB"
database_name = "forms_platform_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**📝 Copy the `database_id` value!**

---

## 3. Update wrangler.toml

Open `wrangler.toml` and replace `TO_BE_CREATED` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "forms_platform_db"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"  # ← Replace this
```

---

## 4. Apply Database Migrations

```bash
wrangler d1 execute forms_platform_db --file=../cf-workers-forms-platform/infra/migrations/001_init.sql
```

**Expected output:**
```
🌀 Mapping SQL input into an array of statements
🌀 Parsing 5 statements
🌀 Executing on forms_platform_db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
🚣 Executed 5 commands in 0.123ms
```

---

## 5. Create R2 Bucket

```bash
wrangler r2 bucket create forms-platform-files
```

**Expected output:**
```
✅ Created bucket 'forms-platform-files' with default storage class set to Standard.
```

---

## 6. Build the Application

**⚠️ Important:** You'll see warnings about deprecated packages. This is expected for MVP.

```bash
npm run build
```

**Expected:** Build should complete successfully (even with warnings).

---

## 7. Deploy to Cloudflare Workers

```bash
wrangler deploy --env staging
```

**Expected output:**
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded forms-platform-staging (X.XX sec)
Published forms-platform-staging (X.XX sec)
  https://forms-platform-staging.<your-subdomain>.workers.dev
```

**📝 Copy your deployment URL!**

---

## 8. Verify Deployment

Test your deployment:

```bash
# Replace with your actual URL
curl https://forms-platform-staging.YOUR_SUBDOMAIN.workers.dev
```

You should see the homepage HTML.

---

## 9. Seed the Template

### Option A: Via API (Recommended)

```bash
# Replace YOUR_URL with your actual deployment URL
curl -X POST https://YOUR_URL/api/admin/templates \
  -H "Content-Type: application/json" \
  -d @../cf-workers-forms-platform/templates/template_parent_data_5_people.json

# Note the template ID from the response
# Then publish it:
curl -X POST https://YOUR_URL/api/admin/templates/TEMPLATE_ID/publish \
  -H "Content-Type: application/json"
```

### Option B: Via Local Dev + Script

```bash
# Terminal 1: Start local dev server
wrangler dev

# Terminal 2: Run seed script
npx tsx scripts/seed.ts
```

---

## 10. Access Your Application

### Public Form
```
https://YOUR_URL/f/TEMPLATE_ID
```

### Admin Dashboard
```
https://YOUR_URL/admin
```

### Admin Templates
```
https://YOUR_URL/admin/templates
```

### Admin Submissions
```
https://YOUR_URL/admin/submissions?templateId=TEMPLATE_ID
```

---

## 🧪 Quick Smoke Test

### Test 1: Form Renders
```bash
curl https://YOUR_URL/f/TEMPLATE_ID
# Should return HTML with form
```

### Test 2: Submit a Form
```bash
curl -X POST https://YOUR_URL/api/submissions \
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
# Should return: {"success": true, "submissionId": "..."}
```

### Test 3: View in Admin
Open in browser:
```
https://YOUR_URL/admin/submissions?templateId=TEMPLATE_ID
```

### Test 4: Export CSV
```bash
curl "https://YOUR_URL/api/admin/exports/csv?templateId=TEMPLATE_ID" -o submissions.csv
cat submissions.csv
```

---

## 🐛 Troubleshooting

### "Not logged in" Error
```bash
wrangler logout
wrangler login
```

### "Database not found" Error
- Verify `database_id` in `wrangler.toml` is correct
- Run: `wrangler d1 list` to see all your databases

### Build Errors
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### "Failed to fetch" in Browser
- Check deployment URL is correct
- Verify D1 binding name is "DB" in wrangler.toml
- Check: `wrangler tail` for live logs

---

## 📊 Post-Deployment Checklist

- [ ] Logged into Cloudflare via `wrangler login`
- [ ] D1 database created and migrations applied
- [ ] R2 bucket created
- [ ] `wrangler.toml` updated with database ID
- [ ] Application built successfully
- [ ] Deployed to Cloudflare Workers
- [ ] Template seeded and published
- [ ] Form renders at `/f/TEMPLATE_ID`
- [ ] Submissions work end-to-end
- [ ] Admin portal accessible
- [ ] CSV export works

---

## ⚠️ Before Production

**CRITICAL:** Add authentication to admin routes!

1. **Enable Cloudflare Access** (Recommended):
   - Go to Cloudflare Dashboard → Access
   - Create an Application
   - Add policy for `/admin/*` routes

2. **Or implement API key auth** in code

**DO NOT deploy to production without admin authentication!**

---

## 🎉 Success!

Once all tests pass, you have a fully functional bilingual forms platform running on Cloudflare Workers!

**Costs:**
- D1: 5M reads/day free
- R2: 10GB storage free
- Workers: 100k requests/day free

**Perfect for MVP testing!**

---

## 📞 Need Help?

- Check logs: `wrangler tail --env staging`
- View D1 data: `wrangler d1 execute forms_platform_db --command "SELECT * FROM templates"`
- See R2 files: `wrangler r2 object list forms-platform-files`

---

**Ready to deploy? Start with Step 1: `wrangler login`**
