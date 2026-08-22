import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function CohortAnalyticsPage() {
  const [cohortData, setCohortData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohortData = async () => {
      try {
        const response: any = await api.get("/api/analytics/cohorts");
        setCohortData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch cohort analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCohortData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading cohort insights...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Cohort Analytics</h1>
        <p className="text-gray-600">Deep-dive insights into student performance across departments and years.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Departmental Performance</h2>
          <div className="space-y-4">
            {cohortData?.departments?.map((dept: any) => (
              <div key={dept.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <span className="text-sm font-bold text-indigo-600">{dept.avgScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${dept.avgScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Placement Readiness Trends</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {cohortData?.trends?.map((trend: any) => (
              <div key={trend.year} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-indigo-100 rounded-t-lg hover:bg-indigo-200 transition-colors"
                  style={{ height: `${trend.score}%` }}
                ></div>
                <span className="text-xs mt-2 text-gray-500">{trend.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Integrity Heatmap (Violations per Cohort)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 font-semibold text-gray-600">Cohort</th>
                <th className="pb-3 font-semibold text-gray-600 text-center">Total Students</th>
                <th className="pb-3 font-semibold text-gray-600 text-center">Avg Violations</th>
                <th className="pb-3 font-semibold text-gray-600 text-center">Integrity Score</th>
              </tr>
            </thead>
            <tbody>
              {cohortData?.cohorts?.map((cohort: any) => (
                <tr key={cohort.name} className="border-b border-gray-50 last:border-0">
                  <td className="py-4 font-medium text-gray-900">{cohort.name}</td>
                  <td className="py-4 text-center text-gray-600">{cohort.students}</td>
                  <td className="py-4 text-center text-red-600 font-bold">{cohort.avgViolations}</td>
                  <td className="py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      cohort.integrityScore > 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cohort.integrityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
