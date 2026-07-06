import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/auth";
import { Layout } from "../components/Layout";

interface AssignmentDto {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  maxPoints: number;
  status: string;
  rubric: { title: string; maxPoints: number }[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AssignmentsPage() {
  const { session } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const isTeacher = session?.user.role !== "student";

  useEffect(() => {
    api
      .get<{ success: boolean; data: AssignmentDto[] }>("/api/assignments")
      .then((res) => setAssignments(res.data))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Assignments</h1>
          {isTeacher && (
            <a
              href="/assignments/new"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              New Assignment
            </a>
          )}
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No assignments yet.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{a.title}</h3>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      a.status === "published"
                        ? "bg-green-100 text-green-700"
                        : a.status === "closed"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{a.description || "No description"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-2 py-0.5">Due {formatDate(a.dueAt)}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">{a.maxPoints} points</span>
                  {a.rubric.length > 0 && (
                    <span className="rounded bg-gray-100 px-2 py-0.5">{a.rubric.length} rubric criteria</span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/assignments/${a.id}`}
                    className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {isTeacher ? "Review" : "Submit"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
