import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

type Test = { id: string; title: string; status: string };
type Overview = { test: Test; enrollmentCount: number; submittedCount: number; completionRate: number; averageScore: number; highestScore: number; averageDurationMinutes: number; distribution: { range: string; count: number }[]; totalViolations: number };
type LeaderboardRow = { rank: number; student: { name: string; email: string }; score: number; percentile: number; submittedAt?: string; attemptNumber: number; violationCount: number };

export default function AnalyticsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ success: boolean; data: Test[] }>("/api/tests").then((response) => {
      const available = response.data.filter((test) => test.status !== "draft");
      setTests(available);
      setSelectedTest(available[0]?.id ?? "");
    }).catch(() => setError("Unable to load assessments.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTest) return;
    setLoading(true);
    setError("");
    Promise.all([
      api.get<{ success: boolean; data: Overview }>(`/api/analytics/tests/${selectedTest}/overview`),
      api.get<{ success: boolean; data: { rows: LeaderboardRow[] } }>(`/api/analytics/tests/${selectedTest}/leaderboard`),
    ]).then(([overviewResponse, leaderboardResponse]) => {
      setOverview(overviewResponse.data);
      setLeaderboard(leaderboardResponse.data.rows);
    }).catch(() => setError("Analytics are not available for this assessment yet.")).finally(() => setLoading(false));
  }, [selectedTest]);

  const totalDistribution = useMemo(() => overview?.distribution.reduce((sum, item) => sum + item.count, 0) ?? 0, [overview]);
  const maxBucket = Math.max(...(overview?.distribution.map((item) => item.count) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Insights</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Assessment analytics</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Understand completion, score distribution, and learner progress from one focused workspace.</p></div>
        <label className="text-sm font-medium text-slate-700">Assessment<select value={selectedTest} onChange={(event) => setSelectedTest(event.target.value)} className="mt-1 block min-w-64 rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Select an assessment</option>{tests.map((test) => <option key={test.id} value={test.id}>{test.title}</option>)}</select></label>
      </div>
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-500">Loading analytics…</div>}
      {!loading && overview && <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Completion", `${overview.completionRate}%`, `${overview.submittedCount} of ${overview.enrollmentCount} enrolled`], ["Average score", `${overview.averageScore}%`, "Across submitted attempts"], ["Highest score", `${overview.highestScore}%`, "Best learner result"], ["Avg. duration", `${overview.averageDurationMinutes} min`, "Time spent per submission"], ["Violations", overview.totalViolations, "Total proctoring alerts"]].map(([label, value, helper]) => <div key={label} className="rounded-lg border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-400">{helper}</p></div>)}</div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Score distribution</h2><p className="mt-1 text-xs text-slate-500">{totalDistribution} submitted attempts</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">Live snapshot</span></div><div className="mt-6 space-y-4">{overview.distribution.map((bucket) => <div key={bucket.range} className="grid grid-cols-[4rem_1fr_2rem] items-center gap-3 text-sm"><span className="text-slate-500">{bucket.range}</span><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-indigo-500 transition-all" style={{ width: `${(bucket.count / maxBucket) * 100}%` }} /></div><span className="text-right font-medium text-slate-700">{bucket.count}</span></div>)}</div></section>
          <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Learner leaderboard</h2><p className="mt-1 text-xs text-slate-500">Best attempt per learner, ranked by percentage.</p><div className="mt-4 space-y-3">{leaderboard.length === 0 && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No submitted attempts yet.</p>}{leaderboard.slice(0, 8).map((row) => <div key={`${row.student.email}-${row.rank}`} className="flex items-center gap-3 rounded-md border border-slate-100 p-3"><span className="w-7 text-center text-sm font-bold text-indigo-600">{row.rank}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{row.student.name}</p><p className="truncate text-xs text-slate-400">{row.student.email} · {row.percentile}th percentile {row.violationCount > 0 && <span className="text-orange-600 font-bold ml-1">(! {row.violationCount})</span>}</p></div><span className="text-sm font-bold text-slate-900">{row.score}%</span></div>)}</div></section>
        </div>
      </>}
      {!loading && !overview && !error && <div className="rounded-lg border border-dashed bg-white p-10 text-center text-sm text-slate-500">Choose a published assessment to view its analytics.</div>}
    </div>
  );
}
