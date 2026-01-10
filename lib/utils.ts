import type { FieldDefinition, TemplateDefinition, SubmissionPayload } from './types';

export function generateId(): string {
  return crypto.randomUUID();
}

export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(buffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hash.substring(0, 32);
}

export function validateEnglishName(value: string): boolean {
  const regex = /^[A-Za-z][A-Za-z\s.'-]{1,98}[A-Za-z]$/;
  return regex.test(value);
}

export function validateField(
  field: FieldDefinition,
  value: any,
  language: 'ar' | 'en'
): { valid: boolean; error?: string } {
  // Check required
  if (field.required && (value === undefined || value === null || value === '')) {
    const errorMsg = field.label[language] || field.label.ar;
    return { valid: false, error: `${errorMsg} مطلوب` };
  }

  // Skip further validation if empty and not required
  if (!field.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Type-specific validation
  if (field.type === 'text' || field.type === 'textarea') {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Invalid text value' };
    }

    // Check regex if provided
    if (field.validation?.regex) {
      const regex = new RegExp(field.validation.regex);
      if (!regex.test(value)) {
        return {
          valid: false,
          error: field.validation.error?.[language] || field.validation.error?.ar || 'Invalid format'
        };
      }
    }

    // Check length constraints
    if (field.validation?.min && value.length < field.validation.min) {
      return { valid: false, error: `Minimum length is ${field.validation.min}` };
    }
    if (field.validation?.max && value.length > field.validation.max) {
      return { valid: false, error: `Maximum length is ${field.validation.max}` };
    }
  }

  if (field.type === 'date') {
    // Basic date validation
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date' };
    }
  }

  if (field.type === 'choice') {
    if (field.options && field.options.length > 0) {
      const validValues = field.options.map(opt => opt.value);
      if (!validValues.includes(value)) {
        return { valid: false, error: 'Invalid choice' };
      }
    }
  }

  return { valid: true };
}

export function validateSubmissionPayload(
  template: TemplateDefinition,
  payload: SubmissionPayload,
  language: 'ar' | 'en'
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of template.fields) {
    // Skip file fields - they are validated separately
    if (field.type === 'file') continue;

    const value = payload[field.key];
    const validation = validateField(field, value, language);

    if (!validation.valid && validation.error) {
      errors[field.key] = validation.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function generateObjectKey(
  templateId: string,
  submissionId: string,
  fieldKey: string,
  filename: string
): string {
  const uuid = crypto.randomUUID();
  const ext = filename.split('.').pop() || 'bin';
  return `forms/${templateId}/submissions/${submissionId}/${fieldKey}/${uuid}.${ext}`;
}

export function parseTemplateDefinition(json: string): TemplateDefinition {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error('Invalid template definition JSON');
  }
}

export function corsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status = 400, headers: Record<string, string> = {}): Response {
  return jsonResponse({ error: message }, status, headers);
}
