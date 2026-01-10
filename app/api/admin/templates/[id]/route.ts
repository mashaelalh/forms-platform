import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import {
  getTemplate,
  updateTemplate,
  createAuditLog
} from '@/lib/db';
import { jsonResponse, errorResponse, parseTemplateDefinition } from '@/lib/utils';
import type { TemplateDefinition } from '@/lib/types';

export const runtime = 'edge';

// Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    const template = await getTemplate(db, id);

    if (!template) {
      return errorResponse('Template not found', 404);
    }

    const definition = parseTemplateDefinition(template.definition_json);

    return jsonResponse({
      id: template.id,
      status: template.status,
      title: { ar: template.title_ar, en: template.title_en },
      description: { ar: template.description_ar, en: template.description_en },
      definition,
      retentionDays: template.retention_days,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    });
  } catch (error) {
    console.error('Get template error:', error);
    return errorResponse('Failed to fetch template', 500);
  }
}

// Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { definition: TemplateDefinition };
    const definition: TemplateDefinition = body.definition;

    if (!definition || !definition.title || !definition.fields) {
      return errorResponse('Invalid template definition', 400);
    }

    const db = getDB();
    const template = await getTemplate(db, id);

    if (!template) {
      return errorResponse('Template not found', 404);
    }

    if (template.status === 'published') {
      return errorResponse('Cannot update published template. Create a new version instead.', 400);
    }

    await updateTemplate(db, id, definition);

    const userId = request.headers.get('x-user-id') || undefined;
    await createAuditLog(db, 'template_updated', userId, 'template', id, {
      title: definition.title,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Update template error:', error);
    return errorResponse('Failed to update template', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}
