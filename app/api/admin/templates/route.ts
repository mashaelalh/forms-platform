import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import {
  createTemplate,
  getAllTemplates,
  createAuditLog
} from '@/lib/db';
import { generateId, jsonResponse, errorResponse, parseTemplateDefinition } from '@/lib/utils';
import type { TemplateDefinition } from '@/lib/types';

export const runtime = 'edge';

// List all templates
export async function GET(request: NextRequest) {
  try {
    const db = getDB();
    const templates = await getAllTemplates(db);

    return jsonResponse({
      templates: templates.map(t => ({
        id: t.id,
        status: t.status,
        title: { ar: t.title_ar, en: t.title_en },
        description: { ar: t.description_ar, en: t.description_en },
        retentionDays: t.retention_days,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return errorResponse('Failed to fetch templates', 500);
  }
}

// Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { definition: TemplateDefinition };
    const definition: TemplateDefinition = body.definition;

    if (!definition || !definition.title || !definition.fields) {
      return errorResponse('Invalid template definition', 400);
    }

    const db = getDB();
    const templateId = generateId();
    const createdBy = request.headers.get('x-user-id') || undefined;

    const template = await createTemplate(db, templateId, definition, createdBy);

    // Audit log
    await createAuditLog(db, 'template_created', createdBy, 'template', templateId, {
      title: definition.title,
    });

    return jsonResponse({
      success: true,
      template: {
        id: template.id,
        status: template.status,
        title: { ar: template.title_ar, en: template.title_en },
      },
    }, 201);
  } catch (error) {
    console.error('Create template error:', error);
    return errorResponse('Failed to create template', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}
