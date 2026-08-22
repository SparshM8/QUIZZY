import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { QuestionDto } from "../api/types";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
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
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { items: QuestionDto[] } }>("/api/questions");
      // res.data is the { items, pagination } object from backend
      const items = res.data?.items || [];
      setQuestions(Array.isArray(items) ? items : []);
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
    if (!form.title || form.title.length < 3 || !form.statement || form.statement.length < 3) {
      alert("Title and statement must be at least 3 characters long.");
      return;
    }
    
    try {
      const payload: any = {
        title: form.title,
        statement: form.statement,
        type: form.type,
        difficulty: form.difficulty,
        points: form.points,
        tags: [],
      };

      if (form.type === "mcq" || form.type === "aptitude" || form.type === "reasoning") {
        const validChoices = form.options.choices.filter(c => c.text.trim() !== "");
        if (validChoices.length < 2) {
          alert("Please provide at least 2 choices for MCQ");
          return;
        }
        payload.options = {
          choices: validChoices.map(c => ({ id: c.id, text: c.text })),
          answerIds: form.options.answerIds
        };
      }

      await api.post("/api/questions", payload);
      
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
    const newId = String(Date.now());
    setForm({
      ...form,
      options: {
        ...form.options,
        choices: [...form.options.choices, { id: newId, text: "" }],
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-1 text-sm text-gray-500 text-balance">Manage your assessment questions here.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
        >
          {showForm ? "Cancel" : "New Question"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <form onSubmit={createQuestion} className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Question</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label className="block text-sm font-medium text-gray-700">Question Title</label>
                  <input
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Basic JavaScript Scope"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Points</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={form.points}
                    min={1}
                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Question Statement</label>
                  <textarea
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Describe the problem or question clearly..."
                    value={form.statement}
                    onChange={(e) => setForm({ ...form, statement: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Question Type</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="coding">Coding Challenge</option>
                    <option value="subjective">Subjective / Text</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {(form.type === "mcq" || form.type === "aptitude" || form.type === "reasoning") && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  <label className="block text-sm font-semibold text-gray-900">Choices (select the correct one)</label>
                  <div className="space-y-3">
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
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <input
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  </div>
                  <button
                    type="button"
                    onClick={addChoice}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add another choice
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Save to Bank
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading question bank...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
          <div className="rounded-full bg-gray-50 p-3">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No questions yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first assessment question.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Create Question
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {questions.map((q) => (
            <div key={q.id || Math.random()} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="p-5 flex-1">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-base font-bold text-gray-900 line-clamp-1">{q.title || "Untitled Question"}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      q.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : q.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {q.status || "draft"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {q.statement || "No statement provided."}
                </p>
              </div>
              <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
                <div className="flex gap-2">
                  <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[10px] font-bold text-gray-600 ring-1 ring-inset ring-gray-200 uppercase">
                    {q.type || "mcq"}
                  </span>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase ring-1 ring-inset ${
                    q.difficulty === "easy" ? "bg-blue-50 text-blue-600 ring-blue-100" :
                    q.difficulty === "medium" ? "bg-orange-50 text-orange-600 ring-orange-100" :
                    "bg-red-50 text-red-600 ring-red-100"
                  }`}>
                    {q.difficulty || "easy"}
                  </span>
                </div>
                <div className="flex items-center text-indigo-600">
                  <span className="text-xs font-bold">{q.points || 0}</span>
                  <span className="ml-1 text-[10px] font-medium uppercase text-gray-400">pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
