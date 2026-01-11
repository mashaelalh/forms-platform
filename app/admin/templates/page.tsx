import Link from 'next/link';
import { getDB, getAllTemplates } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const db = getDB();
  const templates = await getAllTemplates(db);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">القوالب | Templates</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Templates</h2>
          </div>

          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No templates found. Create your first template using the API.</p>
              <code className="block mt-4 p-4 bg-gray-100 rounded text-sm text-left">
                POST /api/admin/templates
              </code>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{template.title_ar}</div>
                      {template.title_en && (
                        <div className="text-sm text-gray-500">{template.title_en}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          template.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : template.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(template.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {template.status === 'published' && (
                          <Link
                            href={`/f/${template.id}`}
                            className="text-blue-600 hover:underline text-sm"
                            target="_blank"
                          >
                            View Form
                          </Link>
                        )}
                        <Link
                          href={`/admin/submissions?templateId=${template.id}`}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Submissions
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
