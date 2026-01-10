import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { createFileRecord } from '@/lib/db';
import { generateId, jsonResponse, errorResponse } from '@/lib/utils';
import type { ConfirmFileRequest } from '@/lib/types';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: submissionId } = await params;
    const body: ConfirmFileRequest = await request.json();
    const { fieldKey, objectKey, mimeType, sizeBytes } = body;

    if (!fieldKey || !objectKey || !mimeType || !sizeBytes) {
      return errorResponse('Missing required fields', 400);
    }

    const db = getDB();

    // Create file record in D1
    const fileId = generateId();
    const fileRecord = await createFileRecord(
      db,
      fileId,
      submissionId,
      fieldKey,
      objectKey,
      mimeType,
      sizeBytes
    );

    return jsonResponse({
      success: true,
      file: {
        id: fileRecord.id,
        fieldKey: fileRecord.field_key,
        objectKey: fileRecord.r2_object_key,
      },
    });
  } catch (error) {
    console.error('Confirm file error:', error);
    return errorResponse('Failed to confirm file upload', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
