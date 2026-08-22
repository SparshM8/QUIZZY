import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/auth";

const ROLE_SUMMARIES: Record<string, { title: string; items: string[] }> = {
  admin: {
    title: "Platform administration",
    items: ["Manage users and roles", "Configure platform settings", "Review moderation queue"],
  },
  teacher: {
    title: "Teaching workspace",
    items: [
      "Build quizzes, tests and coding challenges",
      "Create assignments with deadlines",
      "Review results and analytics",
    ],
  },
  student: {
    title: "Your assessments",
    items: ["Upcoming quizzes and exams", "Active assignments", "Past results and certificates"],
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

      <div className="grid gap-4 md:grid-cols-3">
        <a href={stats[0].to} className="rounded-lg border bg-white p-5 transition hover:border-indigo-300">
          <p className="text-sm font-medium text-slate-500">{stats[0].label}</p>
          <p className="mt-1 text-2xl font-bold">{counts.questions}</p>
          <p className="mt-2 text-xs text-slate-400">Created on the platform</p>
        </a>
        <a href={stats[1].to} className="rounded-lg border bg-white p-5 transition hover:border-indigo-300">
          <p className="text-sm font-medium text-slate-500">{stats[1].label}</p>
          <p className="mt-1 text-2xl font-bold">{counts.tests}</p>
          <p className="mt-2 text-xs text-slate-400">Available to you</p>
        </a>
        <a href={stats[2].to} className="rounded-lg border bg-white p-5 transition hover:border-indigo-300">
          <p className="text-sm font-medium text-slate-500">{stats[2].label}</p>
          <p className="mt-1 text-2xl font-bold">{counts.notifications}</p>
          <p className="mt-2 text-xs text-slate-400">Unread</p>
        </a>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold">{ROLE_SUMMARIES[session?.user.role ?? "student"].title}</h2>
        <ul className="mt-3 space-y-2">
          {ROLE_SUMMARIES[session?.user.role ?? "student"].items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
