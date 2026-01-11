import Link from 'next/link';


export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">لوحة الإدارة | Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/templates">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">القوالب | Templates</h2>
              <p className="text-gray-600">
                إدارة قوالب النماذج | Manage form templates
              </p>
            </div>
          </Link>

          <Link href="/admin/submissions">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">الردود | Submissions</h2>
              <p className="text-gray-600">
                عرض وتصدير الردود | View and export submissions
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold mb-2">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/admin/templates" className="text-blue-600 hover:underline">
                → Create New Template
              </Link>
            </li>
            <li>
              <Link href="/admin/submissions" className="text-blue-600 hover:underline">
                → View All Submissions
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
