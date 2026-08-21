import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TestDto } from "../api/types";
import { useAuth } from "../context/auth";
import { Link } from "react-router-dom";

function formatSchedule(iso?: string) {
  if (!iso) return "Starts immediately when you begin";
  return new Date(iso).toLocaleString();
}

export default function TestsListPage() {
  const { session } = useAuth();
  const isTeacher = session?.user.role === "teacher" || session?.user.role === "admin" || session?.user.role === "recruiter";
  const [tests, setTests] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; data: TestDto[] }>("/api/tests")
      .then((res) => setTests(res.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tests</h1>
        {isTeacher && (
          <Link
            to="/tests/create"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Create Test
          </Link>
        )}
      </div>
      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading tests…</p>
      ) : tests.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          No tests available. Teachers can create tests from the dashboard.
        </p>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{t.description || "No description"}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    t.status === "published" || t.status === "in_progress"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-0.5">{t.durationMinutes} min</span>
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  {formatSchedule(t.scheduledAt)}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  {t.items.length} question{t.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t pt-4">
                <a
                  href={`/tests/${t.id}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Open Test
                </a>
                {isTeacher && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/tests/${t.id}`;
                      navigator.clipboard.writeText(url);
                      alert("Test link copied to clipboard!");
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Copy Link
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
