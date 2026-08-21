import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/dashboard" },
    { name: "Tests", path: "/tests" },
    { name: "Questions", path: "/questions" },
    { name: "Assignments", path: "/assignments" },
    { name: "Analytics", path: "/analytics" },
    ...(session?.user.role === "recruiter" || session?.user.role === "admin"
      ? [{ name: "Recruitment", path: "/recruitment" }]
      : [{ name: "Applications", path: "/applications" }]),
    { name: "Notifications", path: "/notifications" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-primary-600">Quizzy</span>
              <span className="hidden rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700 sm:inline-block">
                {session?.user.role}
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-semibold text-slate-900">{session?.user.name}</span>
              <span className="text-xs text-slate-500">{session?.user.email}</span>
            </div>
            <button
              onClick={() => logout()}
              className="hidden rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:block"
            >
              Log out
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="border-t bg-white lg:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    location.pathname === link.path
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="px-3">
                  <p className="text-base font-medium text-slate-800">{session?.user.name}</p>
                  <p className="text-sm font-medium text-slate-500">{session?.user.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="mt-3 block w-full px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-slate-400">
        Quizzy · Assessment Platform
      </footer>
    </div>
  );
}
