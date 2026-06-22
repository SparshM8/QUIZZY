import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { CodeEditor } from "../components/CodeEditor";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python3", label: "Python 3" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

export default function CodeQuestionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("javascript");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    if (!questionId || submitting) return;
    if (source.trim().length === 0) {
      alert("Write some code before submitting");
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await api.post<{ success: boolean; data: { id: string; verdict: string } }>(
        "/api/coding",
        { questionId, language, sourceCode: source }
      );
      setStatus(`Submission queued (${res.data.id.slice(0, 8)}…) — verdict: ${res.data.verdict}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Coding Challenge</h1>
        <div className="flex items-center gap-3">
          <select
            className="rounded border px-3 py-1.5 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <button
            onClick={() => void submit()}
            disabled={submitting}
            className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Run & Submit"}
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 rounded border bg-blue-50 px-3 py-2 text-sm text-blue-800">{status}</div>
      )}

      <CodeEditor language={language} value={source} onChange={setSource} />

      <button
        onClick={() => navigate("/tests")}
        className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
      >
        ← Back to tests
      </button>
    </div>
  );
}
