import { NextRequest } from 'next/server';
import { getR2 } from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/utils';


export async function PUT(request: NextRequest) {
  try {
    const objectKey = request.headers.get('x-object-key');
    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    if (!objectKey) {
      return errorResponse('Missing object key', 400);
    }

    const r2 = getR2();
    const body = await request.arrayBuffer();

    // Upload to R2
    await r2.put(objectKey, body, {
      httpMetadata: {
        contentType,
      },
    });

    return jsonResponse({ success: true, objectKey });
  } catch (error) {
    console.error('Direct upload error:', error);
    return errorResponse('Failed to upload file', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-object-key',
    },
  });
}
