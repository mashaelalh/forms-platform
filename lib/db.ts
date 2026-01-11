/// <reference types="@cloudflare/workers-types" />

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type {
  Template,
  TemplateVersion,
  Submission,
  FileRecord,
  AuditLog,
  TemplateDefinition
} from './types';

export function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return env.DB;
}

export function getR2(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.FILES;
}

export function getEnv(): CloudflareEnv {
  const { env } = getCloudflareContext();
  return env as CloudflareEnv;
}

// Template operations
export async function createTemplate(
  db: D1Database,
  id: string,
  definition: TemplateDefinition,
  createdBy?: string
): Promise<Template> {
  const now = new Date().toISOString();
  const definitionJson = JSON.stringify(definition);

  await db.prepare(`
    INSERT INTO templates (
      id, status, title_ar, title_en, description_ar, description_en,
      definition_json, retention_days, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    'draft',
    definition.title.ar,
    definition.title.en,
    definition.description.ar,
    definition.description.en,
    definitionJson,
    definition.settings?.retentionDays || 180,
    createdBy || null,
    now,
    now
  ).run();

  const result = await db.prepare('SELECT * FROM templates WHERE id = ?')
    .bind(id)
    .first<Template>();

  if (!result) throw new Error('Failed to create template');
  return result;
}

export async function getTemplate(db: D1Database, id: string): Promise<Template | null> {
  return await db.prepare('SELECT * FROM templates WHERE id = ?')
    .bind(id)
    .first<Template>();
}

export async function getTemplateByStatus(
  db: D1Database,
  status: 'draft' | 'published' | 'archived'
): Promise<Template[]> {
  const result = await db.prepare('SELECT * FROM templates WHERE status = ? ORDER BY updated_at DESC')
    .bind(status)
    .all<Template>();
  return result.results || [];
}

export async function getAllTemplates(db: D1Database): Promise<Template[]> {
  const result = await db.prepare('SELECT * FROM templates ORDER BY updated_at DESC')
    .all<Template>();
  return result.results || [];
}

export async function updateTemplate(
  db: D1Database,
  id: string,
  definition: TemplateDefinition
): Promise<void> {
  const now = new Date().toISOString();
  const definitionJson = JSON.stringify(definition);

  await db.prepare(`
    UPDATE templates
    SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?,
        definition_json = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    definition.title.ar,
    definition.title.en,
    definition.description.ar,
    definition.description.en,
    definitionJson,
    now,
    id
  ).run();
}

export async function publishTemplate(
  db: D1Database,
  id: string,
  version: number
): Promise<void> {
  const template = await getTemplate(db, id);
  if (!template) throw new Error('Template not found');

  // Create version snapshot
  const versionId = `${id}_v${version}`;
  await db.prepare(`
    INSERT INTO template_versions (id, template_id, version, definition_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    versionId,
    id,
    version,
    template.definition_json,
    new Date().toISOString()
  ).run();

  // Update template status
  await db.prepare('UPDATE templates SET status = ?, updated_at = ? WHERE id = ?')
    .bind('published', new Date().toISOString(), id)
    .run();
}

// Submission operations
export async function createSubmission(
  db: D1Database,
  id: string,
  templateId: string,
  templateVersion: number,
  language: 'ar' | 'en',
  payload: any,
  formInstanceToken?: string,
  respondentRef?: string,
  ipHash?: string
): Promise<Submission> {
  const now = new Date().toISOString();
  const payloadJson = JSON.stringify(payload);

  await db.prepare(`
    INSERT INTO submissions (
      id, template_id, template_version, form_instance_token,
      submitted_at, language, respondent_ref, payload_json, ip_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    templateId,
    templateVersion,
    formInstanceToken || null,
    now,
    language,
    respondentRef || null,
    payloadJson,
    ipHash || null
  ).run();

  const result = await db.prepare('SELECT * FROM submissions WHERE id = ?')
    .bind(id)
    .first<Submission>();

  if (!result) throw new Error('Failed to create submission');
  return result;
}

export async function getSubmission(db: D1Database, id: string): Promise<Submission | null> {
  return await db.prepare('SELECT * FROM submissions WHERE id = ?')
    .bind(id)
    .first<Submission>();
}

export async function getSubmissionsByTemplate(
  db: D1Database,
  templateId: string
): Promise<Submission[]> {
  const result = await db.prepare(
    'SELECT * FROM submissions WHERE template_id = ? ORDER BY submitted_at DESC'
  ).bind(templateId).all<Submission>();
  return result.results || [];
}

export async function checkPersonSlotExists(
  db: D1Database,
  templateId: string,
  formInstanceToken: string,
  personSlot: number
): Promise<boolean> {
  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM submissions
    WHERE template_id = ?
    AND form_instance_token = ?
    AND json_extract(payload_json, '$.person_slot') = ?
  `).bind(templateId, formInstanceToken, personSlot).first<{ count: number }>();

  return (result?.count || 0) > 0;
}

// File operations
export async function createFileRecord(
  db: D1Database,
  id: string,
  submissionId: string,
  fieldKey: string,
  r2ObjectKey: string,
  mimeType: string,
  sizeBytes: number
): Promise<FileRecord> {
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO files (id, submission_id, field_key, r2_object_key, mime_type, size_bytes, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, submissionId, fieldKey, r2ObjectKey, mimeType, sizeBytes, now).run();

  const result = await db.prepare('SELECT * FROM files WHERE id = ?')
    .bind(id)
    .first<FileRecord>();

  if (!result) throw new Error('Failed to create file record');
  return result;
}

export async function getFilesBySubmission(
  db: D1Database,
  submissionId: string
): Promise<FileRecord[]> {
  const result = await db.prepare('SELECT * FROM files WHERE submission_id = ?')
    .bind(submissionId)
    .all<FileRecord>();
  return result.results || [];
}

// Audit log operations
export async function createAuditLog(
  db: D1Database,
  action: string,
  actorId?: string,
  targetType?: string,
  targetId?: string,
  metadata?: any
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  await db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, timestamp, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    actorId || null,
    action,
    targetType || null,
    targetId || null,
    now,
    metadataJson
  ).run();
}
