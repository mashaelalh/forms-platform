import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import {
  getTemplate,
  publishTemplate,
  createAuditLog
} from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/utils';

export const runtime = 'edge';

export async function POST(
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

    if (template.status === 'published') {
      return errorResponse('Template is already published', 400);
    }

    // Get next version number
    // For MVP, we'll use version 1 for first publish
    const version = 1;

    await publishTemplate(db, id, version);

    const userId = request.headers.get('x-user-id') || undefined;
    await createAuditLog(db, 'template_published', userId, 'template', id, {
      version,
    });

    return jsonResponse({
      success: true,
      version,
    });
  } catch (error) {
    console.error('Publish template error:', error);
    return errorResponse('Failed to publish template', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}
