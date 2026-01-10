/**
 * Seed script to populate the database with initial templates
 * Usage: npx tsx scripts/seed.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const TEMPLATE_FILE = '../cf-workers-forms-platform/templates/template_parent_data_5_people.json';

async function seed() {
  console.log('🌱 Seeding database with initial templates...');

  try {
    // Read template file
    const templatePath = join(__dirname, TEMPLATE_FILE);
    const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));

    console.log(`📄 Loaded template: ${templateData.title.en}`);

    // Create template via API
    const response = await fetch('http://localhost:8788/api/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        definition: templateData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create template: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log(`✅ Template created with ID: ${result.template.id}`);

    // Publish template
    const publishResponse = await fetch(
      `http://localhost:8788/api/admin/templates/${result.template.id}/publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(`Failed to publish template: ${JSON.stringify(error)}`);
    }

    console.log(`✅ Template published`);
    console.log(`\n🎉 Seeding complete!`);
    console.log(`\nAccess the form at: http://localhost:8788/f/${result.template.id}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
