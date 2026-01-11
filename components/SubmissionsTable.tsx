'use client';

import { useState } from 'react';
import type { Submission } from '@/lib/types';

interface SubmissionsTableProps {
  submissions: Submission[];
}

export default function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  if (submissions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No submissions yet for this template.</p>
      </div>
    );
  }

  return (
    <>
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
                    onClick={() => setSelectedPayload(payload)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal for viewing submission details */}
      {selectedPayload && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedPayload(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Submission Details</h3>
              <button
                onClick={() => setSelectedPayload(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
