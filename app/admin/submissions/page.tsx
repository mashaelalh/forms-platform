import Link from 'next/link';
import { getDB, getSubmissionsByTemplate, getAllTemplates } from '@/lib/db';
import type { Submission, Template } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    templateId?: string;
  }>;
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const db = getDB();
  const { templateId } = await searchParams;

  let submissions: Submission[] = [];
  let template: Template | null = null;

  if (templateId) {
    submissions = await getSubmissionsByTemplate(db, templateId);
    const templates = await getAllTemplates(db);
    template = templates.find((t) => t.id === templateId) || null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">الردود | Submissions</h1>
          <div className="flex gap-2">
            {templateId && (
              <Link
                href={`/api/admin/exports/csv?templateId=${templateId}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Export CSV
              </Link>
            )}
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {!templateId ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
            <p className="text-gray-600 mb-4">
              Please select a template from the templates page to view submissions.
            </p>
            <Link
              href="/admin/templates"
              className="text-blue-600 hover:underline"
            >
              Go to Templates →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {template ? `${template.title_ar} (${template.title_en || ''})` : 'Submissions'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Total submissions: {submissions.length}
              </p>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No submissions yet for this template.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Language
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Slot
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((submission) => {
                    const payload = JSON.parse(submission.payload_json);
                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono">
                          {submission.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {submission.language === 'ar' ? 'عربي' : 'English'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {payload.person_slot || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="text-blue-600 hover:underline text-sm"
                            onClick={() => alert(JSON.stringify(payload, null, 2))}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
