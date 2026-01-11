import { getDB } from '@/lib/db';
import { getTemplate } from '@/lib/db';
import { parseTemplateDefinition } from '@/lib/utils';
import FormRenderer from '@/components/FormRenderer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function FormPage({ params }: PageProps) {
  const { token } = await params;

  // For MVP, token is the template ID
  // In production, you'd have a mapping table for tokens -> templates
  try {
    const db = getDB();
    const template = await getTemplate(db, token);

    if (!template || template.status !== 'published') {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xl text-gray-600">النموذج غير موجود | Form not found</p>
          </div>
        </div>
      );
    }

    const definition = parseTemplateDefinition(template.definition_json);

    return <FormRenderer template={definition} token={token} />;
  } catch (error) {
    console.error('Error loading form:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">خطأ | Error</h1>
          <p className="text-xl text-gray-600">
            فشل تحميل النموذج | Failed to load form
          </p>
        </div>
      </div>
    );
  }
}
