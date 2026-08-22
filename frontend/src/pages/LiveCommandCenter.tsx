import { useEffect, useState } from "react";
import { api } from "../api/client";

interface LiveAttempt {
  id: string;
  studentName: string;
  testTitle: string;
  violationCount: number;
  lastViolationType?: string;
  lastViolationTime?: string;
  status: string;
  progress: number;
}

export default function LiveCommandCenter() {
  const [liveAttempts, setLiveAttempts] = useState<LiveAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveStatus = async () => {
    try {
      const res = await api.get<{ success: boolean; data: LiveAttempt[] }>("/api/analytics/live");
      setLiveAttempts(res.data);
    } catch (err) {
      console.error("Failed to fetch live status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Command Center</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time monitoring of active assessment sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Live Monitoring Active</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Connecting to live stream...</p>
        </div>
      ) : liveAttempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
          <h3 className="text-sm font-semibold text-gray-900">No active sessions</h3>
          <p className="mt-1 text-sm text-gray-500">Currently, no students are taking tests.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveAttempts.map((attempt) => (
            <div key={attempt.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${attempt.violationCount > 0 ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {(attempt.studentName || "?").charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{attempt.studentName || "Unknown Student"}</h3>
                      <p className="text-xs text-gray-500">{attempt.testTitle}</p>
                    </div>
                  </div>
                  <div className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${attempt.violationCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {attempt.violationCount} Violations
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                      <span>Progress</span>
                      <span>{attempt.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${attempt.progress}%` }} />
                    </div>
                  </div>

                  {attempt.lastViolationType && (
                    <div className="rounded-lg bg-red-50 p-3">
                      <div className="flex items-center gap-2 text-red-700 font-bold text-[10px] uppercase mb-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Critical Alert
                      </div>
                      <p className="text-xs text-red-600 font-medium">
                        {attempt.lastViolationType?.replace('_', ' ') || "N/A"} detected
                      </p>
                      <p className="text-[10px] text-red-400 mt-1">
                        {attempt.lastViolationTime ? new Date(attempt.lastViolationTime).toLocaleTimeString() : "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Attempt</span>
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
