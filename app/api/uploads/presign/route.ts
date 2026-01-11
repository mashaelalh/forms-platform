import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getR2 } from '@/lib/db';
import { generateObjectKey, jsonResponse, errorResponse } from '@/lib/utils';
import type { PresignUploadRequest, PresignUploadResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: PresignUploadRequest = await request.json();
    const { submissionId, fieldKey, filename, mimeType, sizeBytes } = body;

    // Validate request
    if (!submissionId || !fieldKey || !filename || !mimeType || !sizeBytes) {
      return errorResponse('Missing required fields', 400);
    }

    const { env } = getCloudflareContext();
    const cloudflareEnv = env as unknown as CloudflareEnv;
    const maxSizeMB = parseInt(cloudflareEnv.MAX_FILE_SIZE_MB || '20');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (sizeBytes > maxSizeBytes) {
      return errorResponse(`File size exceeds maximum of ${maxSizeMB}MB`, 400);
    }

    // Generate object key
    // Note: We need templateId, but for MVP we can extract it from submissionId pattern
    // or require it in the request. For now, using a placeholder.
    const objectKey = generateObjectKey('template', submissionId, fieldKey, filename);

    const r2 = getR2();

    // Create presigned URL for upload
    // Note: R2 presigned URLs are created using the httpMetadata options
    const uploadUrl = await r2.createMultipartUpload(objectKey, {
      httpMetadata: {
        contentType: mimeType,
      },
    });

    // For R2, we need to use a different approach
    // We'll return a signed URL that allows direct upload
    // In a real implementation, you'd use R2's presigned URL capability

    // Simplified approach: Return object key and expect client to upload via our confirm endpoint
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    const response: PresignUploadResponse = {
      uploadUrl: `${cloudflareEnv.APP_BASE_URL}/api/uploads/direct`, // Placeholder
      objectKey,
      expiresAt,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Presign upload error:', error);
    return errorResponse('Failed to create presigned upload URL', 500);
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
