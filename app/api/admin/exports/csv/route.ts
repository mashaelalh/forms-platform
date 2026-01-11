import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import {
  getTemplate,
  getSubmissionsByTemplate,
  getFilesBySubmission,
  createAuditLog
} from '@/lib/db';
import { errorResponse, parseTemplateDefinition } from '@/lib/utils';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return errorResponse('Missing templateId parameter', 400);
    }

    const db = getDB();
    const template = await getTemplate(db, templateId);

    if (!template) {
      return errorResponse('Template not found', 404);
    }

    const definition = parseTemplateDefinition(template.definition_json);
    const submissions = await getSubmissionsByTemplate(db, templateId);

    // Build CSV header
    const headers = [
      'Submission ID',
      'Submitted At',
      'Language',
      'Form Instance Token',
    ];

    // Add field headers
    for (const field of definition.fields) {
      if (field.type === 'file') {
        headers.push(`${field.label.en || field.label.ar} (File Key)`);
      } else {
        headers.push(field.label.en || field.label.ar);
      }
    }

    // Build CSV rows
    const rows = [headers];

    for (const submission of submissions) {
      const payload = JSON.parse(submission.payload_json);
      const row = [
        submission.id,
        submission.submitted_at,
        submission.language,
        submission.form_instance_token || '',
      ];

      // Add field values
      for (const field of definition.fields) {
        if (field.type === 'file') {
          // Get file records for this submission
          const files = await getFilesBySubmission(db, submission.id);
          const fieldFile = files.find((f) => f.field_key === field.key);
          row.push(fieldFile ? fieldFile.r2_object_key : '');
        } else {
          const value = payload[field.key];
          row.push(value !== undefined && value !== null ? String(value) : '');
        }
      }

      rows.push(row);
    }

    // Convert to CSV string
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    // Audit log
    const userId = request.headers.get('x-user-id') || undefined;
    await createAuditLog(db, 'export_csv', userId, 'template', templateId, {
      count: submissions.length,
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="submissions_${templateId}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return errorResponse('Failed to export CSV', 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}
