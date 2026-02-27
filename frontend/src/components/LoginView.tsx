import React from 'react';
import { Shield, Loader2, Eye, EyeOff, BookOpen, Calculator, Atom, Microscope } from 'lucide-react';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface LoginViewProps {
  error: string;
  isLoginMode: boolean;
  setIsLoginMode: (mode: boolean) => void;
  loginData: LoginData;
  handleLoginChange: (field: string, value: string) => void;
  registerData: RegisterData;
  handleRegisterChange: (field: string, value: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: (show: boolean) => void;
  showRegisterPassword: boolean;
  setShowRegisterPassword: (show: boolean) => void;
  handleLogin: () => void;
  handleRegister: () => void;
  loading: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({
  error,
  isLoginMode,
  setIsLoginMode,
  loginData,
  handleLoginChange,
  registerData,
  handleRegisterChange,
  showLoginPassword,
  setShowLoginPassword,
  showRegisterPassword,
  setShowRegisterPassword,
  handleLogin,
  handleRegister,
  loading
}) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4 relative overflow-hidden">
    {/* Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      {/* Floating Mathematical Symbols */}
      <div className="absolute top-20 left-10 animate-bounce bounce-delay-0">
        <div className="text-6xl text-red-200 font-bold">π</div>
      </div>
      <div className="absolute top-40 right-20 animate-bounce bounce-delay-1">
        <div className="text-5xl text-red-300 font-bold">∑</div>
      </div>
      <div className="absolute bottom-32 left-20 animate-bounce bounce-delay-2">
        <div className="text-4xl text-red-400 font-bold">√</div>
      </div>
      <div className="absolute bottom-20 right-10 animate-bounce bounce-delay-05">
        <div className="text-5xl text-red-200 font-bold">∫</div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-1/4 left-1/4 animate-spin spin-slow">
        <div className="w-16 h-16 border-4 border-red-200 rounded-full opacity-20"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/4 animate-spin spin-slower-reverse">
        <div className="w-12 h-12 border-4 border-red-300 rotate-45 opacity-30"></div>
      </div>
    </div>

    <div className="w-full max-w-md relative z-10">
      {/* Main Login Card */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-100 p-8 relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-3xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-50 to-transparent rounded-tr-3xl"></div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
            Quizzy
          </h1>
          <p className="text-red-600 font-medium">Advanced Testing Platform</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Calculator className="w-5 h-5 text-red-400" />
            <Atom className="w-5 h-5 text-red-500" />
            <Microscope className="w-5 h-5 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login/Register Toggle */}
        <div className="flex mb-6 bg-red-50 rounded-xl p-1 border border-red-100">
          <button
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              isLoginMode
                ? 'bg-white text-red-800 shadow-md border border-red-200 transform scale-105'
                : 'text-red-600 hover:text-red-800 hover:bg-red-100/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              !isLoginMode
                ? 'bg-white text-red-800 shadow-md border border-red-200 transform scale-105'
                : 'text-red-600 hover:text-red-800 hover:bg-red-100/50'
            }`}
          >
            Sign Up
          </button>
        </div>

        {isLoginMode ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-2">Email Address</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => handleLoginChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/90 placeholder-red-300"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => handleLoginChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/90 placeholder-red-300"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          // Registration Form
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-2">Full Name</label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) => handleRegisterChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/90 placeholder-red-300"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-2">Email Address</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => handleRegisterChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/90 placeholder-red-300"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerData.password}
                  onChange={(e) => handleRegisterChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/90 placeholder-red-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors"
                >
                  {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="account-type" className="block text-sm font-semibold text-red-700 mb-2">Account Type</label>
              <select
                id="account-type"
                value={registerData.role}
                onChange={(e) => handleRegisterChange('role', e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/90"
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-red-500">
          <Shield className="w-4 h-4" />
          <span>Secure & Encrypted Platform</span>
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(LoginView);