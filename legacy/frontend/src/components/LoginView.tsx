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
}) => {

  // ✅ FIXED SUBMIT FUNCTIONS
  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-red-100 p-8">

          <div className="text-center mb-8">
            <BookOpen className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-red-700">Quizzy</h1>
            <p className="text-red-500">Advanced Testing Platform</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Toggle */}
          <div className="flex mb-6 bg-red-50 rounded-xl p-1">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 rounded-lg ${isLoginMode ? "bg-white text-red-700" : "text-red-500"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 rounded-lg ${!isLoginMode ? "bg-white text-red-700" : "text-red-500"}`}
            >
              Sign Up
            </button>
          </div>

          {isLoginMode ? (

            <form onSubmit={submitLogin} className="space-y-4">

              <input
                type="email"
                value={loginData.email}
                onChange={(e) => handleLoginChange('email', e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 border rounded-xl"
                required
              />

              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => handleLoginChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 border rounded-xl pr-10"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-red-500"
                >
                  {showLoginPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-xl flex justify-center"
              >
                {loading && <Loader2 className="animate-spin mr-2" />}
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
                className="w-full px-4 py-3 border rounded-xl"
                required
              />

              <input
                type="email"
                value={registerData.email}
                onChange={(e) => handleRegisterChange('email', e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 border rounded-xl"
                required
              />

              <input
                type="password"
                value={registerData.password}
                onChange={(e) => handleRegisterChange('password', e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border rounded-xl"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-xl flex justify-center"
              >
                {loading && <Loader2 className="animate-spin mr-2" />}
                Create Account
              </button>

            </form>
          )}

          <div className="mt-6 text-center text-sm text-red-500 flex justify-center gap-2">
            <Shield size={16}/>
            Secure Platform
          </div>

        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginView);
