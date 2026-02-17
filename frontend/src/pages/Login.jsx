import { useState, useEffect } from "react";
import { GoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";

export default function Login({ goToRegister }) {
  const { login, googleLogin } = useAuth();
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      
      // Save email if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-sm text-slate-400">Sign in to continue your DSA journey</p>
        </div>

        {/* Google Sign In */}
        <div className="flex justify-center mb-2">
          {!scriptLoadedSuccessfully ? (
            <div className="h-[40px] w-[380px] rounded bg-slate-700/50 animate-pulse flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-600" />
              <div className="h-3 w-32 rounded bg-slate-600" />
            </div>
          ) : (
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setError("");
                setLoading(true);
                try {
                  await googleLogin(credentialResponse.credential);
                } catch (err) {
                  setError(err.response?.data?.detail || "Google sign-in failed.");
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => setError("Google sign-in failed.")}
              text="signin_with"
              shape="rectangular"
              theme="filled_black"
              size="medium"
              width="380"
            />
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="text-sm text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-slate-300 mb-1 text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email username"
              className="w-full p-2.5 rounded-lg bg-slate-700/50 border border-slate-600 outline-none focus:border-blue-500 transition text-white placeholder-slate-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-300 mb-1 text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full p-2.5 rounded-lg bg-slate-700/50 border border-slate-600 outline-none focus:border-blue-500 transition text-white placeholder-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-300">
              Remember my email
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm">* {error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400">
          Don't have an account?{" "}
          <button
            onClick={goToRegister}
            className="text-blue-400 hover:text-blue-300 font-medium transition"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}