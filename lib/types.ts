// Template types
export interface BilingualText {
  ar: string;
  en: string;
}

export interface FieldValidation {
  regex?: string;
  min?: number;
  max?: number;
  error?: BilingualText;
}

export interface FileFieldConfig {
  maxFiles: number;
  maxSizeMB: number;
  accept: string[];
}

export interface ChoiceOption {
  value: string | number;
  label: BilingualText;
}

export type FieldType = 'text' | 'textarea' | 'date' | 'choice' | 'file';

export interface FieldDefinition {
  key: string;
  type: FieldType;
  required: boolean;
  label: BilingualText;
  placeholder?: BilingualText;
  help?: BilingualText;
  validation?: FieldValidation;
  file?: FileFieldConfig;
  options?: ChoiceOption[];
}

export interface TemplateSettings {
  personSlotsEnabled?: boolean;
  personSlots?: number[];
  maxSubmissionsPerSlot?: number;
  retentionDays?: number;
}

export interface TemplateDefinition {
  templateKey: string;
  title: BilingualText;
  description: BilingualText;
  defaultLanguage: 'ar' | 'en';
  settings?: TemplateSettings;
  fields: FieldDefinition[];
}

// Database types
export interface Template {
  id: string;
  status: 'draft' | 'published' | 'archived';
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  definition_json: string;
  retention_days: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  definition_json: string;
  created_at: string;
}

export interface Submission {
  id: string;
  template_id: string;
  template_version: number;
  form_instance_token: string | null;
  submitted_at: string;
  language: 'ar' | 'en';
  respondent_ref: string | null;
  payload_json: string;
  completion_flags_json: string | null;
  ip_hash: string | null;
}

export interface FileRecord {
  id: string;
  submission_id: string;
  field_key: string;
  r2_object_key: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  timestamp: string;
  metadata_json: string | null;
}

// API types
export interface PresignUploadRequest {
  submissionId: string;
  fieldKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

export interface ConfirmFileRequest {
  fieldKey: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SubmissionPayload {
  [key: string]: any;
}

export interface CreateSubmissionRequest {
  token: string;
  language: 'ar' | 'en';
  payload: SubmissionPayload;
  respondentRef?: string;
}
