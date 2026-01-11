import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import {
  getTemplate,
  createSubmission,
  checkPersonSlotExists
} from '@/lib/db';
import {
  generateId,
  jsonResponse,
  errorResponse,
  parseTemplateDefinition,
  validateSubmissionPayload
} from '@/lib/utils';
import type { CreateSubmissionRequest } from '@/lib/types';


export async function POST(request: NextRequest) {
  try {
    const body: CreateSubmissionRequest = await request.json();
    const { token, language, payload, respondentRef } = body;

    if (!token || !language || !payload) {
      return errorResponse('Missing required fields', 400);
    }

    const db = getDB();

    // For MVP, token is template ID
    // In production, implement proper token -> template mapping
    const template = await getTemplate(db, token);

    if (!template || template.status !== 'published') {
      return errorResponse('Invalid or unpublished template', 400);
    }

    const definition = parseTemplateDefinition(template.definition_json);

    // Server-side validation
    const validation = validateSubmissionPayload(definition, payload, language);

    if (!validation.valid) {
      return jsonResponse(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        400
      );
    }

    // Check person slot uniqueness if enabled
    if (definition.settings?.personSlotsEnabled && payload.person_slot) {
      const slotExists = await checkPersonSlotExists(
        db,
        template.id,
        token, // form instance token
        payload.person_slot
      );

      if (slotExists) {
        return jsonResponse(
          {
            error: 'Validation failed',
            errors: {
              person_slot:
                language === 'ar'
                  ? 'هذا الرقم محجوز بالفعل. يرجى اختيار رقم آخر.'
                  : 'This slot is already taken. Please choose another.',
            },
          },
          400
        );
      }
    }

    // Get IP for hashing (optional rate limiting)
    const ip = request.headers.get('cf-connecting-ip') ||
               request.headers.get('x-forwarded-for') ||
               'unknown';

    // Simple hash (in production, use proper crypto)
    const ipHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ip)
    ).then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    });

    // Create submission
    const submissionId = generateId();
    const submission = await createSubmission(
      db,
      submissionId,
      template.id,
      1, // template version (MVP: always 1)
      language,
      payload,
      token, // form instance token
      respondentRef,
      ipHash
    );

    return jsonResponse(
      {
        success: true,
        submissionId: submission.id,
        message:
          language === 'ar'
            ? 'تم إرسال النموذج بنجاح'
            : 'Form submitted successfully',
      },
      201
    );
  } catch (error) {
    console.error('Submission error:', error);
    return errorResponse('Failed to create submission', 500);
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
