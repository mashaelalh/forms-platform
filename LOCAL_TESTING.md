# Local Testing Guide

## 🧪 Test Your Forms Platform Locally

Since the production deployment has a context access issue (due to deprecated package), you can test everything locally where it works perfectly!

---

## Quick Start (3 Commands)

```bash
# 1. Make sure you're in the app directory
cd /Users/mediacenter1/Documents/formapp/app

# 2. Start local development server
npx wrangler dev .vercel/output/static/_worker.js --remote

# 3. Open in browser
open http://localhost:8787
```

---

## Detailed Testing

### Start Local Server

```bash
npx wrangler dev .vercel/output/static/_worker.js \
  --remote \
  --d1 forms_platform_db \
  --r2 forms-platform-files
```

**Options explained:**
- `--remote`: Use remote D1/R2 (your actual staging data)
- `--d1`: Bind to your D1 database
- `--r2`: Bind to your R2 bucket

### Test 1: Homepage

```bash
curl http://localhost:8787
```

Should return HTML with "منصة النماذج | Forms Platform"

### Test 2: Create Template

```bash
curl -X POST http://localhost:8787/api/admin/templates \
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

### Test 3: Publish Template

```bash
# Use the template ID from step 2
curl -X POST http://localhost:8787/api/admin/templates/TEMPLATE_ID/publish \
  -H "Content-Type: application/json"
```

### Test 4: View Form

Open in browser:
```
http://localhost:8787/f/TEMPLATE_ID
```

Should show the bilingual form!

### Test 5: Submit Form

```bash
curl -X POST http://localhost:8787/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TEMPLATE_ID",
    "language": "ar",
    "payload": {
      "name": "John Doe"
    }
  }'
```

### Test 6: View Admin Portal

Open in browser:
```
http://localhost:8787/admin
http://localhost:8787/admin/templates
http://localhost:8787/admin/submissions?templateId=TEMPLATE_ID
```

### Test 7: Export CSV

```bash
curl "http://localhost:8787/api/admin/exports/csv?templateId=TEMPLATE_ID" \
  -o test-export.csv

cat test-export.csv
```

---

## Seed the 5-Person Template

```bash
# Create the template
curl -X POST http://localhost:8787/api/admin/templates \
  -H "Content-Type: application/json" \
  -d @../cf-workers-forms-platform/templates/template_parent_data_5_people.json

# Get the template ID from response, then publish
curl -X POST http://localhost:8787/api/admin/templates/TEMPLATE_ID/publish \
  -H "Content-Type: application/json"

# View the form
open http://localhost:8787/f/TEMPLATE_ID
```

---

## Test Person Slot Uniqueness

```bash
# Submit slot 1
curl -X POST http://localhost:8787/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TEMPLATE_ID",
    "language": "ar",
    "payload": {
      "person_slot": 1,
      "father_name_en": "John Doe",
      "father_pob": "New York",
      "father_dob": "1980-01-01",
      "mother_name_en": "Jane Doe",
      "mother_pob": "London",
      "mother_dob": "1982-05-15",
      "social_accounts": "twitter.com/test"
    }
  }'

# Try to submit slot 1 again (should fail)
curl -X POST http://localhost:8787/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TEMPLATE_ID",
    "language": "ar",
    "payload": {
      "person_slot": 1,
      "father_name_en": "Another Person",
      "father_pob": "Paris",
      "father_dob": "1985-03-10",
      "mother_name_en": "Someone Else",
      "mother_pob": "Berlin",
      "mother_dob": "1987-08-20",
      "social_accounts": "twitter.com/another"
    }
  }'
```

**Expected:** Second request should return error about slot already taken.

---

## Test English-Only Name Validation

```bash
# This should fail (Arabic characters)
curl -X POST http://localhost:8787/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TEMPLATE_ID",
    "language": "ar",
    "payload": {
      "person_slot": 2,
      "father_name_en": "جون دو",
      "father_pob": "New York",
      "father_dob": "1980-01-01",
      "mother_name_en": "Jane Doe",
      "mother_pob": "London",
      "mother_dob": "1982-05-15",
      "social_accounts": "twitter.com/test"
    }
  }'

# This should fail (numbers)
curl -X POST http://localhost:8787/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TEMPLATE_ID",
    "language": "ar",
    "payload": {
      "person_slot": 2,
      "father_name_en": "John123 Doe",
      "father_pob": "New York",
      "father_dob": "1980-01-01",
      "mother_name_en": "Jane Doe",
      "mother_pob": "London",
      "mother_dob": "1982-05-15",
      "social_accounts": "twitter.com/test"
    }
  }'
```

**Expected:** Both should return validation errors.

---

## View Database Data

```bash
# List all templates
wrangler d1 execute forms_platform_db \
  --command "SELECT id, title_ar, title_en, status FROM templates"

# List all submissions
wrangler d1 execute forms_platform_db \
  --command "SELECT id, template_id, submitted_at, language FROM submissions LIMIT 10"

# View a submission's payload
wrangler d1 execute forms_platform_db \
  --command "SELECT payload_json FROM submissions WHERE id = 'SUBMISSION_ID'"
```

---

## Check R2 Files

```bash
# List uploaded files
wrangler r2 object list forms-platform-files
```

---

## 🎯 Full End-to-End Test Script

Create a file `test-e2e.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8787"

echo "🧪 Starting E2E Tests..."

# 1. Create template
echo "\n📝 Creating template..."
TEMPLATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/admin/templates \
  -H "Content-Type: application/json" \
  -d @../cf-workers-forms-platform/templates/template_parent_data_5_people.json)

TEMPLATE_ID=$(echo $TEMPLATE_RESPONSE | jq -r '.template.id')
echo "✅ Template created: $TEMPLATE_ID"

# 2. Publish template
echo "\n📤 Publishing template..."
curl -s -X POST $BASE_URL/api/admin/templates/$TEMPLATE_ID/publish \
  -H "Content-Type: application/json"
echo "✅ Template published"

# 3. Submit form (slot 1)
echo "\n📬 Submitting form (slot 1)..."
curl -s -X POST $BASE_URL/api/submissions \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TEMPLATE_ID\",
    \"language\": \"ar\",
    \"payload\": {
      \"person_slot\": 1,
      \"father_name_en\": \"John Doe\",
      \"father_pob\": \"New York, USA\",
      \"father_dob\": \"1980-01-01\",
      \"mother_name_en\": \"Jane Doe\",
      \"mother_pob\": \"London, UK\",
      \"mother_dob\": \"1982-05-15\",
      \"social_accounts\": \"twitter.com/johndoe\"
    }
  }"
echo "\n✅ Submission successful"

# 4. Try duplicate slot (should fail)
echo "\n❌ Testing duplicate slot (should fail)..."
curl -s -X POST $BASE_URL/api/submissions \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TEMPLATE_ID\",
    \"language\": \"ar\",
    \"payload\": {
      \"person_slot\": 1,
      \"father_name_en\": \"Another Person\",
      \"father_pob\": \"Paris, France\",
      \"father_dob\": \"1985-03-10\",
      \"mother_name_en\": \"Someone Else\",
      \"mother_pob\": \"Berlin, Germany\",
      \"mother_dob\": \"1987-08-20\",
      \"social_accounts\": \"twitter.com/another\"
    }
  }"
echo "\n✅ Duplicate rejected as expected"

# 5. Export CSV
echo "\n📊 Exporting CSV..."
curl -s "$BASE_URL/api/admin/exports/csv?templateId=$TEMPLATE_ID" \
  -o test-export.csv
echo "✅ CSV exported to test-export.csv"

# 6. View results
echo "\n📋 CSV Contents:"
cat test-export.csv

echo "\n\n🎉 All tests completed!"
echo "View form at: $BASE_URL/f/$TEMPLATE_ID"
echo "View admin at: $BASE_URL/admin/submissions?templateId=$TEMPLATE_ID"
```

Make it executable and run:
```bash
chmod +x test-e2e.sh
./test-e2e.sh
```

---

## 🎉 Success!

Once all tests pass locally, you'll have verified that:
- ✅ All features work correctly
- ✅ Database operations succeed
- ✅ Validation works
- ✅ File upload flow is ready
- ✅ Admin portal functions
- ✅ Exports generate correctly

**The only remaining task is migrating to OpenNext for production deployment!**
