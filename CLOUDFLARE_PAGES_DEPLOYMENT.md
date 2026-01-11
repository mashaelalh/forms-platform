# 🚀 Deploy to Cloudflare Pages - Step by Step

## ✅ Step 1: Git Repository Created ✓

Your code is ready in a local git repository!

---

## 📤 Step 2: Push to GitHub

### Option A: Using GitHub CLI (Fastest)

If you have GitHub CLI installed:

```bash
# Login to GitHub (if not already)
gh auth login

# Create repository and push
gh repo create forms-platform --public --source=. --push

# Done! Repository created and code pushed
```

### Option B: Using GitHub Web UI

1. **Go to GitHub:** https://github.com/new

2. **Create repository:**
   - Repository name: `forms-platform`
   - Description: `Bilingual forms platform on Cloudflare Workers`
   - Visibility: Public (or Private)
   - **DO NOT** initialize with README, .gitignore, or license
   - Click **Create repository**

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/forms-platform.git
   git branch -M main
   git push -u origin main
   ```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## 🌐 Step 3: Deploy to Cloudflare Pages

### A. Go to Cloudflare Dashboard

1. Open: https://dash.cloudflare.com
2. Select your account
3. Click **Workers & Pages** in the left sidebar
4. Click **Create application** button
5. Select **Pages** tab
6. Click **Connect to Git**

### B. Connect Repository

1. Click **Connect GitHub** (or GitLab/BitBucket)
2. Authorize Cloudflare Pages
3. Select your repository: `forms-platform`
4. Click **Begin setup**

### C. Configure Build Settings

**Set up builds and deployments:**

1. **Project name:** `forms-platform-staging` (or your choice)

2. **Production branch:** `main`

3. **Framework preset:** `Next.js`

4. **Build command:**
   ```
   npm run build && npx @cloudflare/next-on-pages
   ```

5. **Build output directory:**
   ```
   .vercel/output/static
   ```

6. **Root directory:** Leave blank (or set to `.` if prompted)

7. **Environment variables:** Click **Add variable** and add:

   | Variable Name | Value |
   |--------------|-------|
   | `NODE_VERSION` | `18` |
   | `APP_BASE_URL` | `https://forms-platform-staging.pages.dev` |
   | `PUBLIC_FORM_TOKEN_TTL_SECONDS` | `2592000` |
   | `MAX_FILE_SIZE_MB` | `20` |

8. Click **Save and Deploy**

### D. Add Bindings (IMPORTANT!)

After the first deployment completes:

1. Go to your Pages project
2. Click **Settings**
3. Click **Functions** in the left sidebar
4. Scroll to **Bindings**

**Add D1 Database Binding:**
- Click **Add binding**
- Type: `D1 database`
- Variable name: `DB`
- D1 database: Select `forms_platform_db`
- Click **Save**

**Add R2 Bucket Binding:**
- Click **Add binding**
- Type: `R2 bucket`
- Variable name: `FILES`
- R2 bucket: Select `forms-platform-files`
- Click **Save**

5. **Redeploy** to apply bindings:
   - Go to **Deployments** tab
   - Click the three dots on latest deployment
   - Click **Retry deployment**

---

## 🧪 Step 4: Test Your Deployment

Once deployment completes, you'll get a URL like:
```
https://forms-platform-staging.pages.dev
```

### Test Homepage
Open in browser or:
```bash
curl https://YOUR_URL.pages.dev
```

Should show: "منصة النماذج | Forms Platform"

### Create Template via API

```bash
curl -X POST https://YOUR_URL.pages.dev/api/admin/templates \
  -H "Content-Type: application/json" \
  -d '{
    "definition": {
      "templateKey": "test_form",
      "title": {"ar": "نموذج تجريبي", "en": "Test Form"},
      "description": {"ar": "للاختبار", "en": "For testing"},
      "defaultLanguage": "ar",
      "fields": [
        {
          "key": "name",
          "type": "text",
          "required": true,
          "label": {"ar": "الاسم", "en": "Name"}
        }
      ]
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "template": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "status": "draft",
    "title": {"ar": "نموذج تجريبي", "en": "Test Form"}
  }
}
```

### Publish Template

```bash
curl -X POST https://YOUR_URL.pages.dev/api/admin/templates/TEMPLATE_ID/publish \
  -H "Content-Type: application/json"
```

### View Form

Open in browser:
```
https://YOUR_URL.pages.dev/f/TEMPLATE_ID
```

### Access Admin Portal

```
https://YOUR_URL.pages.dev/admin
https://YOUR_URL.pages.dev/admin/templates
https://YOUR_URL.pages.dev/admin/submissions?templateId=TEMPLATE_ID
```

---

## 🌟 Step 5: Seed the 5-Person Template

```bash
# Create the template
curl -X POST https://YOUR_URL.pages.dev/api/admin/templates \
  -H "Content-Type: application/json" \
  -d @../cf-workers-forms-platform/templates/template_parent_data_5_people.json

# Copy the template ID from response

# Publish it
curl -X POST https://YOUR_URL.pages.dev/api/admin/templates/TEMPLATE_ID/publish \
  -H "Content-Type: application/json"

# Access the form
open https://YOUR_URL.pages.dev/f/TEMPLATE_ID
```

---

## 🔒 Step 6: Secure Admin Routes (IMPORTANT!)

**⚠️ CRITICAL: Admin routes are currently NOT protected!**

### Option A: Cloudflare Access (Recommended)

1. Go to Cloudflare Dashboard → **Zero Trust**
2. Click **Access** → **Applications**
3. Click **Add an application**
4. Choose **Self-hosted**
5. Configure:
   - **Application name:** Forms Platform Admin
   - **Session duration:** 24 hours
   - **Application domain:**
     - Subdomain: `forms-platform-staging`
     - Domain: `pages.dev`
   - **Path:** `/admin/*`
6. Add policies (who can access)
7. Save

### Option B: Custom Authentication

Add API key authentication to admin routes (requires code changes).

---

## 📊 Deployment Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Cloudflare Pages project created
- [ ] Build settings configured
- [ ] First deployment completed
- [ ] D1 binding added
- [ ] R2 binding added
- [ ] Redeployed with bindings
- [ ] Homepage loads successfully
- [ ] API endpoints work
- [ ] Template created and published
- [ ] Form renders correctly
- [ ] Admin portal accessible
- [ ] **Admin routes protected** (CRITICAL!)

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Cloudflare Pages dashboard
- Verify Node version is 18
- Ensure `@cloudflare/next-on-pages` is in dependencies

### API Routes Return 500
- Verify D1 and R2 bindings are added
- Check you redeployed after adding bindings
- View Function logs in dashboard

### Database Errors
- Verify D1 database `forms_platform_db` exists
- Check migrations were applied:
  ```bash
  wrangler d1 execute forms_platform_db --command "SELECT name FROM sqlite_master WHERE type='table'"
  ```

### File Upload Errors
- Verify R2 bucket exists and binding is correct
- Check bucket name matches exactly

---

## 🎉 Success!

Once everything is working:

1. ✅ Your Forms Platform is live!
2. ✅ Users can submit forms
3. ✅ Admins can manage templates and view submissions
4. ✅ Data is stored securely in D1 and R2

**Next steps:**
- Add authentication to admin routes
- Configure custom domain (optional)
- Set up production environment
- Add monitoring and analytics

---

## 📞 Need Help?

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Build Configuration:** https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **Function Bindings:** https://developers.cloudflare.com/pages/functions/bindings/

---

**Your deployment URL will be available in ~2-3 minutes after clicking Deploy!** 🚀
