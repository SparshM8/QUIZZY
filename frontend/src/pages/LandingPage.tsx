import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero Section */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Quizzy Placement Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Log in</Link>
            <Link to="/register" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-100 rounded-full blur-3xl opacity-50" />
          </div>
          
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Empowering the Next Generation of Engineers
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
              The all-in-one assessment platform for college placements. AI-proctored coding tests, aptitude assessments, and real-time skill analytics to make you placement-ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-indigo-500 hover:-translate-y-1 transition-all">
                Join the Drive
              </Link>
              <Link to="/login" className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-all">
                Student Login
              </Link>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-60">
              <span className="text-sm font-bold tracking-widest uppercase">Trusted by</span>
              <span className="text-xl font-black italic">TECH CORP</span>
              <span className="text-xl font-black italic">GLOBAL SOFT</span>
              <span className="text-xl font-black italic">INNOVA</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-slate-50 py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 mb-4">Built for Integrity and Excellence</h2>
              <p className="text-slate-600">Advanced features designed to simulate real-world recruitment processes.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "AI Proctoring",
                  desc: "Advanced object detection and behavioral analysis to ensure exam integrity.",
                  icon: "🤖"
                },
                {
                  title: "Coding Judge",
                  desc: "Multi-language support with real-time evaluation of algorithms and complexity.",
                  icon: "💻"
                },
                {
                  title: "Skill Analytics",
                  desc: "Detailed readiness reports mapped to top-tier company requirements.",
                  icon: "📊"
                }
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-5xl rounded-3xl bg-indigo-600 p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full" />
            <h2 className="text-3xl font-bold mb-6">Ready to transform your placement cell?</h2>
            <p className="text-indigo-100 mb-10 max-w-2xl mx-auto">Join hundreds of students and faculty members who are already using Quizzy Placement Pro to achieve their career goals.</p>
            <Link to="/register" className="inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-indigo-600 hover:bg-indigo-50 transition-all">
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold tracking-tight">Quizzy Placement Pro</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Quizzy Placement Pro. All rights reserved.</p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
