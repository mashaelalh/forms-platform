'use client';

import { useState } from 'react';
import type { TemplateDefinition, FieldDefinition, BilingualText } from '@/lib/types';

interface FormRendererProps {
  template: TemplateDefinition;
  token: string;
  language?: 'ar' | 'en';
}

export default function FormRenderer({ template, token, language: initialLang }: FormRendererProps) {
  const [language, setLanguage] = useState<'ar' | 'en'>(initialLang || template.defaultLanguage);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getText = (text: BilingualText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || text.ar || text.en || '';
  };

  const handleChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleFileChange = async (fieldKey: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);

    try {
      // Step 1: Create submission first (we'll need the ID)
      // For now, we'll store file reference in formData
      setFormData(prev => ({ ...prev, [fieldKey]: file.name }));
    } catch (error) {
      console.error('File upload error:', error);
      setErrors(prev => ({ ...prev, [fieldKey]: 'Upload failed' }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setUploading(true);

    try {
      // Submit form data
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          language,
          payload: formData,
        }),
      });

      const result = await response.json() as { success?: boolean; errors?: Record<string, string>; error?: string };

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          throw new Error(result.error || 'Submission failed');
        }
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ _form: 'فشل الإرسال. يرجى المحاولة مرة أخرى.' });
    } finally {
      setUploading(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const label = getText(field.label);
    const placeholder = getText(field.placeholder);
    const help = getText(field.help);
    const error = errors[field.key];

    const commonClasses = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const errorClasses = error ? "border-red-500" : "border-gray-300";

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="mb-4">
            <label className="block mb-2 font-semibold">
              {label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {help && <p className="text-sm text-gray-600 mb-2">{help}</p>}
            <input
              type="text"
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={placeholder}
              className={`${commonClasses} ${errorClasses}`}
              required={field.required}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="mb-4">
            <label className="block mb-2 font-semibold">
              {label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {help && <p className="text-sm text-gray-600 mb-2">{help}</p>}
            <textarea
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={placeholder}
              rows={4}
              className={`${commonClasses} ${errorClasses}`}
              required={field.required}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.key} className="mb-4">
            <label className="block mb-2 font-semibold">
              {label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {help && <p className="text-sm text-gray-600 mb-2">{help}</p>}
            <input
              type="date"
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`${commonClasses} ${errorClasses}`}
              required={field.required}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'choice':
        return (
          <div key={field.key} className="mb-4">
            <label className="block mb-2 font-semibold">
              {label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {help && <p className="text-sm text-gray-600 mb-2">{help}</p>}
            <select
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`${commonClasses} ${errorClasses}`}
              required={field.required}
            >
              <option value="">-- {language === 'ar' ? 'اختر' : 'Select'} --</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {getText(option.label)}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={field.key} className="mb-4">
            <label className="block mb-2 font-semibold">
              {label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {help && <p className="text-sm text-gray-600 mb-2">{help}</p>}
            <input
              type="file"
              onChange={(e) => handleFileChange(field.key, e.target.files)}
              accept={field.file?.accept.join(',')}
              className={`${commonClasses} ${errorClasses}`}
              required={field.required}
            />
            {field.file && (
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' ? 'الحد الأقصى' : 'Max'}: {field.file.maxSizeMB}MB
              </p>
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            {language === 'ar' ? 'تم الإرسال بنجاح!' : 'Submitted Successfully!'}
          </h2>
          <p className="text-green-700">
            {language === 'ar'
              ? 'شكراً لك على إرسال النموذج. تم حفظ بياناتك بنجاح.'
              : 'Thank you for submitting the form. Your data has been saved successfully.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{getText(template.title)}</h1>
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>
        {template.description && (
          <p className="text-gray-600">{getText(template.description)}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {template.fields.map(field => renderField(field))}

        {errors._form && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {errors._form}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading
            ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
            : (language === 'ar' ? 'إرسال' : 'Submit')}
        </button>
      </form>
    </div>
  );
}
