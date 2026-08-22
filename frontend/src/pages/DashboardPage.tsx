import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/auth";

const ROLE_SUMMARIES: Record<string, { title: string; items: string[] }> = {
  admin: {
    title: "Platform administration",
    items: ["Manage users and roles", "Configure platform settings", "Review moderation queue"],
  },
  teacher: {
    title: "Placement Coordinator Workspace",
    items: [
      "Build aptitude, reasoning, and technical assessments",
      "Create placement preparation modules",
      "Review student performance and analytics",
    ],
  },
  student: {
    title: "Your Placement Journey",
    items: [
      "Upcoming aptitude and reasoning tests",
      "Active placement preparation modules",
      "Performance analytics and skill reports",
    ],
  },
};

function statLink(to: string, label: string) {
  return { to, label };
}

export function DashboardPage() {
  const { session } = useAuth();
  const isTeacher = session?.user.role === "teacher";
  const isAdmin = session?.user.role === "admin";
  const [counts, setCounts] = useState({ questions: 0, tests: 0, notifications: 0 });

  useEffect(() => {
    Promise.all([
      api
        .get<{ success: boolean; data: { total: number } }>("/api/questions?limit=1")
        .then((r) => r.data.total ?? 0)
        .catch(() => 0),
      api
        .get<{ success: boolean; data: unknown[] }>("/api/tests")
        .then((r) => (r.data as unknown[]).length)
        .catch(() => 0),
      api
        .get<{ success: boolean; data: { unread: number } }>("/api/notifications")
        .then((r) => r.data.unread)
        .catch(() => 0),
    ]).then(([questions, tests, notifications]) => setCounts({ questions, tests, notifications }));
  }, []);

  const stats = isAdmin
    ? [
        statLink("/users", "Users"),
        statLink("/tests", "Assessments"),
        statLink("/notifications", "Notifications"),
      ]
    : isTeacher
    ? [
        statLink("/questions", "Questions"),
        statLink("/tests", "Tests"),
        statLink("/notifications", "Notifications"),
      ]
    : [
        statLink("/tests", "Tests"),
        statLink("/questions", "Question bank"),
        statLink("/notifications", "Notifications"),
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session?.user.name}</h1>
        <p className="mt-1 text-sm text-slate-500 capitalize">Signed in as {session?.user.role}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <a href={stats[0].to} className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-500 hover:shadow-md">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-indigo-50 opacity-50 group-hover:bg-indigo-100 transition-colors" />
          <p className="relative text-sm font-semibold text-slate-500 uppercase tracking-wider">{stats[0].label}</p>
          <p className="relative mt-2 text-3xl font-extrabold text-slate-900">{counts.questions}</p>
          <p className="relative mt-2 text-xs text-slate-400 font-medium">Total platform resources</p>
        </a>
        <a href={stats[1].to} className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-500 hover:shadow-md">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-50 opacity-50 group-hover:bg-emerald-100 transition-colors" />
          <p className="relative text-sm font-semibold text-slate-500 uppercase tracking-wider">{stats[1].label}</p>
          <p className="relative mt-2 text-3xl font-extrabold text-slate-900">{counts.tests}</p>
          <p className="relative mt-2 text-xs text-slate-400 font-medium">Available assessments</p>
        </a>
        <a href={stats[2].to} className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-500 hover:shadow-md">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-amber-50 opacity-50 group-hover:bg-amber-100 transition-colors" />
          <p className="relative text-sm font-semibold text-slate-500 uppercase tracking-wider">{stats[2].label}</p>
          <p className="relative mt-2 text-3xl font-extrabold text-slate-900">{counts.notifications}</p>
          <p className="relative mt-2 text-xs text-slate-400 font-medium">Recent updates</p>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">{ROLE_SUMMARIES[session?.user.role ?? "student"].title}</h2>
          <div className="mt-4 space-y-4">
            {ROLE_SUMMARIES[session?.user.role ?? "student"].items.map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-indigo-600 to-violet-700 p-6 shadow-sm text-white">
          <h2 className="text-lg font-bold">Preparation Quick Start</h2>
          <p className="mt-2 text-sm text-indigo-100 leading-relaxed">
            Maximize your placement potential with our curated assessment modules. 
            Practice aptitude, reasoning, and technical skills daily.
          </p>
          <div className="mt-6 space-y-3">
            <a href="/tests" className="block w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 transition-colors text-center border border-white/20">
              Browse All Assessments
            </a>
            <a href="/questions" className="block w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors text-center">
              Practice Questions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
