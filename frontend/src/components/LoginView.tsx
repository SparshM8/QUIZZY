import React from 'react';
import { Shield, Loader2, Eye, EyeOff, BookOpen, Calculator, Atom, Microscope } from 'lucide-react';

const LoginView = ({
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
}) => {

  const submitLogin = (e:any) => {
    e.preventDefault();
    handleLogin();
  };

  const submitRegister = (e:any) => {
    e.preventDefault();
    handleRegister();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-2xl border border-red-100 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-6 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-red-700 mb-2">Quizzy</h1>
            <p className="text-red-500">Advanced Testing Platform</p>

            <div className="flex justify-center space-x-3 mt-3">
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
                <option value="admin">Administrator</option>
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
