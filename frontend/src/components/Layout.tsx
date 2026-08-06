import { useAuth } from "../context/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-700">Quizzy</span>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 capitalize">
              {session?.user.role}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-4 text-sm font-medium text-slate-600 md:flex">
              <a href="/dashboard" className="hover:text-indigo-600">Home</a>
              <a href="/tests" className="hover:text-indigo-600">Tests</a>
              <a href="/questions" className="hover:text-indigo-600">Questions</a>
              <a href="/assignments" className="hover:text-indigo-600">Assignments</a>
              {session?.user.role === "recruiter" || session?.user.role === "admin" ? (
                <a href="/recruitment" className="hover:text-indigo-600">Recruitment</a>
              ) : (
                <a href="/applications" className="hover:text-indigo-600">Applications</a>
              )}
              <a href="/notifications" className="hover:text-indigo-600">Notifications</a>
            </nav>
            <span className="text-sm text-slate-600">{session?.user.name}</span>
            <button
              onClick={() => logout()}
              className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-slate-400">
        Quizzy · Assessment Platform
      </footer>
    </div>
  );
}
