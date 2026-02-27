import React from 'react';
import { ArrowRight, Shield, BarChart3, Award, Users, BookOpen, Target, CheckCircle, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Quizzy</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onLogin} 
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={onSignup} 
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <section className="py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-medium bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-blue-700 mb-6">
              <CheckCircle className="w-4 h-4" />
              Professional Online Examination Platform
            </div>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
              Run secure exams with confidence
            </h2>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Complete examination platform for institutions and teams. Manage multi-level administration, 
              conduct secure assessments, generate certificates, and track performance analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button 
                onClick={onLogin} 
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={onSignup} 
                className="px-6 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Create Account
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600 mt-1">Secure Platform</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600 mt-1">Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-600 mt-1">Scalability</div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Assessments</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Anti-cheating measures, tab monitoring, and time-bound exams ensure integrity.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Level Roles</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Super Admin, Admin, Manager, and Student roles for granular access control.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto Certificates</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Automatically generate and distribute certificates upon exam completion.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Analytics</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track performance, pass rates, and trends with real-time dashboards.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 border-t border-gray-200">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">How Quizzy Works</h3>
            <p className="text-lg text-gray-600">Simple, powerful, and secure exam management</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Create Exams</h4>
              <p className="text-gray-600">
                Build custom exams with multiple choice questions, set duration, difficulty, and passing criteria.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Invite Students</h4>
              <p className="text-gray-600">
                Share unique exam links with students. They join with one click and start instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Track Results</h4>
              <p className="text-gray-600">
                View comprehensive analytics, generate certificates, and monitor performance trends.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h3 className="text-4xl font-bold mb-4">Ready to elevate your assessments?</h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join institutions and teams using Quizzy for secure, scalable exam management.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={onSignup} 
                className="px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:bg-gray-100 transition-all shadow-lg"
              >
                Start Free Today
              </button>
              <button 
                onClick={onLogin} 
                className="px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p>&copy; 2026 Quizzy. Professional Online Examination Platform.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default React.memo(LandingPage);
