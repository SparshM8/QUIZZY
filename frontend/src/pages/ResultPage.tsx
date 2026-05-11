import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

export default function ResultPage() {
  const { attemptId } = useParams<{ testId: string; attemptId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    attempt: { totalScore: number; maxPossibleScore: number; autoSubmitted: boolean; submittedAt: string; status: string };
    test: { title: string; showResultsImmediately: boolean };
    answers: Record<string, unknown>[];
  } | null>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; data: { attempt: unknown; test: unknown; answers: Record<string, unknown>[] } }>(
        `/api/tests/attempts/${attemptId}/result`
      )
      .then((res) => setData(res.data as never))
      .catch(() => navigate("/tests"));
  }, [attemptId, navigate]);

  if (!data) {
    return <p className="p-10 text-center text-gray-500">Loading result…</p>;
  }

  const { attempt, test } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">{test.title}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Status: <span className="font-medium">{attempt.status}</span>
          {attempt.autoSubmitted && (
            <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
              Auto-submitted (time expired)
            </span>
          )}
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {attempt.totalScore ?? "—"}
            </p>
            <p className="text-xs text-gray-500">Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-400">/ {attempt.maxPossibleScore}</p>
            <p className="text-xs text-gray-500">Max possible</p>
          </div>
        </div>
        {test.showResultsImmediately && (
          <p className="mt-2 text-xs text-gray-500">
            Objective question scores are shown below. Subjective questions will be graded later.
          </p>
        )}
        <button
          onClick={() => navigate("/tests")}
          className="mt-6 rounded bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Tests
        </button>
      </div>
    </div>
  );
}
