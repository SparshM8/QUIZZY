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
  onBackHome?: () => void;
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
  loading,
  onBackHome
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
          {onBackHome && (
            <div className="flex justify-start mb-3">
              <button type="button" onClick={onBackHome} className="text-sm text-red-600 hover:text-red-800 font-medium">
                ← Back to home
              </button>
            </div>
          )}
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

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Toggle */}
          <div className="flex mb-6 bg-red-50 rounded-xl p-1">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${isLoginMode ? "bg-white text-red-700 shadow" : "text-red-500"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${!isLoginMode ? "bg-white text-red-700 shadow" : "text-red-500"}`}
            >
              Sign Up
            </button>
          </div>

          {isLoginMode ? (

            <form onSubmit={submitLogin} className="space-y-4">

              <input
                type="email"
                autoComplete="email"
                value={loginData.email}
                onChange={(e) => handleLoginChange('email', e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500"
                required
              />

              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={(e) => handleLoginChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  required
                />

                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                >
                  {showLoginPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 flex justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Sign In
              </button>
            </form>

          ) : (

            <form onSubmit={submitRegister} className="space-y-4">

              <input
                type="text"
                value={registerData.name}
                onChange={(e) => handleRegisterChange('name', e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 border border-red-200 rounded-xl"
                required
              />

              <input
                type="email"
                autoComplete="email"
                value={registerData.email}
                onChange={(e) => handleRegisterChange('email', e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 border border-red-200 rounded-xl"
                required
              />

              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerData.password}
                  onChange={(e) => handleRegisterChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 border border-red-200 rounded-xl"
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                >
                  {showRegisterPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <select
                value={registerData.role}
                onChange={(e) => handleRegisterChange('role', e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl"
              >
                <option value="student">Student</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 flex justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Create Account
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-red-500 flex justify-center items-center gap-2">
            <Shield size={16}/>
            Secure & Encrypted Platform
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginView);
