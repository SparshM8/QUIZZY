import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { QuestionDto } from "../api/types";

export default function CreateTestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    status: "published",
    items: [] as { questionId: string; points: number; order: number }[],
  });

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await api.get<{ success: boolean; data: { items: QuestionDto[] } }>("/api/questions");
        setQuestions(res.data.items || []);
      } catch (err) {
        console.error("Failed to load questions:", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    void loadQuestions();
  }, []);

  const toggleQuestion = (question: QuestionDto) => {
    const isSelected = form.items.find(item => item.questionId === question.id);
    if (isSelected) {
      setForm({
        ...form,
        items: form.items.filter(item => item.questionId !== question.id)
      });
    } else {
      setForm({
        ...form,
        items: [
          ...form.items,
          { 
            questionId: question.id, 
            points: question.points, 
            order: form.items.length + 1 
          }
        ]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.items.length === 0) {
      setError("Please select at least one question for the test.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/tests", form);
      navigate("/tests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Test</h1>
        <p className="text-sm text-gray-500">
          Define test details and select questions from your bank.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Step 1: Test Details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="title">
                  Test Title
                </label>
                <input
                  id="title"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g., Python Basics Assessment"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="What should candidates know about this test?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="duration">
                    Duration (mins)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    required
                    min={1}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Step 2: Select Questions</h2>
            {loadingQuestions ? (
              <p className="text-center py-10 text-gray-500">Loading your question bank...</p>
            ) : questions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-2">Your question bank is empty.</p>
                <button 
                  type="button"
                  onClick={() => navigate("/questions")}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Create questions first
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map(q => {
                  const isSelected = form.items.find(item => item.questionId === q.id);
                  return (
                    <div 
                      key={q.id}
                      onClick={() => toggleQuestion(q)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        isSelected ? "border-indigo-500 bg-indigo-50" : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                            isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white"
                          }`}>
                            {isSelected && (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{q.title}</span>
                        </div>
                        <span className="text-xs text-gray-500 uppercase">{q.type} • {q.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Selected Questions</span>
                <span className="font-semibold">{form.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Points</span>
                <span className="font-semibold">
                  {form.items.reduce((sum, item) => sum + item.points, 0)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold">{form.durationMinutes} mins</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || form.items.length === 0}
              className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Test"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/tests")}
              className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
