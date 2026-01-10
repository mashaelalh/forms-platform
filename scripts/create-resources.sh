#!/bin/bash
# Script to create Cloudflare resources for staging

set -e

echo "🚀 Creating Cloudflare resources for Forms Platform..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Create D1 database
echo "📊 Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create forms_platform_db 2>&1)
echo "$DB_OUTPUT"

# Extract database ID from output
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$DB_ID" ]; then
    echo "❌ Failed to extract database ID. Please check the output above."
    exit 1
fi

echo "✅ Database created with ID: $DB_ID"

# Update wrangler.toml with the database ID
echo "📝 Updating wrangler.toml with database ID..."
sed -i.bak "s/database_id = \"TO_BE_CREATED\"/database_id = \"$DB_ID\"/" wrangler.toml

# Apply migrations
echo "📄 Applying database migrations..."
wrangler d1 execute forms_platform_db --file=../cf-workers-forms-platform/infra/migrations/001_init.sql

# Create R2 bucket
echo "📦 Creating R2 bucket..."
wrangler r2 bucket create forms-platform-files || echo "Bucket may already exist, continuing..."

echo ""
echo "✅ All resources created successfully!"
echo ""
echo "Next steps:"
echo "1. Review and update wrangler.toml if needed"
echo "2. Run: npm run build"
echo "3. Run: npm run deploy:staging"
echo ""
