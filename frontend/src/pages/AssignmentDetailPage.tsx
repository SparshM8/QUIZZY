import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

interface SubmissionDto {
  id: string;
  fileName: string;
  totalGrade?: number;
}

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { session } = useAuth();
  const isTeacher = session?.user.role !== "student";
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; data: AssignmentDto }>(`/api/assignments/${assignmentId}`),
      api.get<{ success: boolean; data: SubmissionDto | null }>(`/api/assignments/${assignmentId}/my-submission`),
    ])
      .then(([aRes, sRes]) => {
        setAssignment(aRes.data);
        setSubmission(sRes.data);
      })
      .catch(() => setAssignment(null));
  }, [assignmentId]);

  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = (e.currentTarget.file as HTMLInputElement).files?.[0];
    if (!file || !assignmentId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = localStorage.getItem("quizzy.accessToken");
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = (await res.json()) as { success?: boolean; data?: SubmissionDto; error?: { message: string } };
      if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
      setSubmission(data.data ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!assignment) {
    return (
      <Layout>
        <p className="py-10 text-center text-gray-500">Assignment not found.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{assignment.description}</p>
        <p className="mt-2 text-sm text-gray-500">
          Due {new Date(assignment.dueAt).toLocaleString()} · {assignment.maxPoints} points
        </p>

        {assignment.rubric.length > 0 && (
          <div className="mt-4 rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Grading rubric</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              {assignment.rubric.map((r) => (
                <li key={r.title} className="flex justify-between">
                  <span>{r.title}</span>
                  <span className="text-gray-400">{r.maxPoints} pts</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-lg border bg-white p-4">
          {isTeacher ? (
            <div>
              <h2 className="font-semibold">Review submissions</h2>
              <p className="mt-1 text-sm text-gray-500">
                Grade student submissions from this section (available for teachers).
              </p>
            </div>
          ) : submission ? (
            <div>
              <h2 className="font-semibold">Your submission</h2>
              <p className="mt-1 text-sm text-gray-600">{submission.fileName}</p>
              {submission.totalGrade !== undefined ? (
                <p className="mt-1 text-sm font-medium text-green-700">
                  Graded: {submission.totalGrade} / {assignment.maxPoints}
                </p>
              ) : (
                <p className="mt-1 text-sm text-yellow-700">Submitted — awaiting grading.</p>
              )}
            </div>
          ) : (
            <form onSubmit={upload}>
              <h2 className="mb-2 font-semibold">Submit your work</h2>
              <input
                name="file"
                type="file"
                className="mb-3 block w-full rounded border p-2 text-sm"
              />
              <button
                type="submit"
                disabled={uploading}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Submit"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
