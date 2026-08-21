import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { QuestionDto } from "../api/types";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    statement: "",
    type: "mcq" as string,
    difficulty: "easy" as string,
    points: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; data: QuestionDto[] }>("/api/questions")
      .then((res) => setQuestions(res.data))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.length < 3 || form.statement.length < 3) return;
    try {
      await api.post("/api/questions", { ...form, tags: [], options: { choices: [], answerIds: [] } });
      const res = await api.get<{ success: boolean; data: QuestionDto[] }>("/api/questions");
      setQuestions(res.data);
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create question");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "New Question"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createQuestion} className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Create a draft question</h2>
          <input
            className="mb-3 w-full rounded border px-3 py-2"
            placeholder="Question title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="mb-3 w-full rounded border px-3 py-2"
            placeholder="Question statement"
            value={form.statement}
            onChange={(e) => setForm({ ...form, statement: e.target.value })}
            rows={3}
          />
          <div className="flex gap-3">
            <select
              className="rounded border px-3 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="mcq">MCQ</option>
              <option value="multi_select">Multi-select</option>
              <option value="true_false">True/False</option>
              <option value="fill_blank">Fill in the blank</option>
              <option value="numerical">Numerical</option>
              <option value="coding">Coding</option>
              <option value="subjective">Subjective</option>
            </select>
            <select
              className="rounded border px-3 py-2"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input
              type="number"
              className="w-24 rounded border px-3 py-2"
              value={form.points}
              min={1}
              onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
            />
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save Draft
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading questions…</p>
      ) : questions.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No questions yet. Create the first one.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{q.title}</h3>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    q.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : q.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {q.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{q.statement}</p>
              <div className="mt-2 flex gap-2 text-xs text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-0.5">{q.type}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5">{q.difficulty}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5">{q.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
