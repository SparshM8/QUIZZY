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
    options: {
      choices: [
        { id: "1", text: "" },
        { id: "2", text: "" },
      ],
      answerIds: ["1"],
    },
  });
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { items: QuestionDto[] } }>("/api/questions");
      // The backend returns { success: true, data: { items: [...], pagination: {...} } }
      setQuestions(res.data.items || []);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, []);

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.length < 3 || form.statement.length < 3) return;
    
    try {
      // Basic validation for MCQ
      if (form.type === "mcq") {
        const validChoices = form.options.choices.filter(c => c.text.trim() !== "");
        if (validChoices.length < 2) {
          alert("Please provide at least 2 choices for MCQ");
          return;
        }
      }

      await api.post("/api/questions", { 
        ...form, 
        tags: [],
        options: form.type === "mcq" ? {
          choices: form.options.choices.map(c => ({ id: c.id, text: c.text })),
          answerIds: form.options.answerIds
        } : undefined
      });
      
      await loadQuestions();
      setShowForm(false);
      setForm({
        title: "",
        statement: "",
        type: "mcq",
        difficulty: "easy",
        points: 10,
        options: {
          choices: [
            { id: "1", text: "" },
            { id: "2", text: "" },
          ],
          answerIds: ["1"],
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create question");
    }
  };

  const addChoice = () => {
    const newId = String(form.options.choices.length + 1);
    setForm({
      ...form,
      options: {
        ...form.options,
        choices: [...form.options.choices, { id: newId, text: "" }],
      }
    });
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
        <form onSubmit={createQuestion} className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Create a new question</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input
                className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Question title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Question Statement</label>
              <textarea
                className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe the question..."
                value={form.statement}
                onChange={(e) => setForm({ ...form, statement: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="mcq">MCQ</option>
                  <option value="subjective">Subjective</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Difficulty</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Points</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={form.points}
                  min={1}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                />
              </div>
            </div>

            {form.type === "mcq" && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-gray-700">Choices (select the correct one)</label>
                {form.options.choices.map((choice, idx) => (
                  <div key={choice.id} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct-choice"
                      checked={form.options.answerIds.includes(choice.id)}
                      onChange={() => setForm({
                        ...form,
                        options: { ...form.options, answerIds: [choice.id] }
                      })}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <input
                      className="flex-1 rounded border px-3 py-2 text-sm"
                      placeholder={`Choice ${idx + 1}`}
                      value={choice.text}
                      onChange={(e) => {
                        const newChoices = [...form.options.choices];
                        newChoices[idx].text = e.target.value;
                        setForm({ ...form, options: { ...form.options, choices: newChoices } });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChoice}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  + Add Choice
                </button>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
              >
                Save Question
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed py-20 text-center">
          <p className="text-gray-500">No questions in the bank yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Create your first question
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {questions.map((q) => (
            <div key={q.id} className="flex flex-col rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{q.title}</h3>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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
              <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-2">{q.statement}</p>
              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 uppercase">{q.type}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${
                    q.difficulty === "easy" ? "bg-blue-50 text-blue-600" :
                    q.difficulty === "medium" ? "bg-orange-50 text-orange-600" :
                    "bg-red-50 text-red-600"
                  }`}>{q.difficulty}</span>
                </div>
                <span className="text-xs font-semibold text-indigo-600">{q.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
