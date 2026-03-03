import { useState, useCallback } from "react";
import { useGoogleOAuth } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";

export default function Register({ goToLogin }) {
  const { googleAuth, completeSignup } = useAuth();
  const { scriptLoadedSuccessfully } = useGoogleOAuth();

  // Step tracking: "google" → "complete-signup"
  const [step, setStep] = useState("google"); // "google" | "complete-signup"
  const [signupToken, setSignupToken] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd) => {
    if (pwd.length < 8)
      return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least one lowercase letter";
    if (!/\d/.test(pwd))
      return "Password must contain at least one number";
    return null;
  };

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const result = await googleAuth(credentialResponse.credential);
      setSignupToken(result.signup_token);
      setGoogleEmail(result.email);
      setStep("complete-signup");
    } catch (err) {
      setError(err.response?.data?.detail || "Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [googleAuth]);

  const triggerGoogleSignUp = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.prompt();
  }, [handleGoogleCredential]);

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    try {
      await completeSignup(signupToken, name, password);
      setSuccess(true);
      setTimeout(() => goToLogin(), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to complete signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "complete-signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
        <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Complete Your Account</h1>
            <p className="text-sm text-slate-400">Set your name and password to finish signing up</p>
          </div>

          <form onSubmit={handleCompleteSignup} className="space-y-3">
            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                disabled
                className="w-full p-2.5 rounded-lg bg-slate-700/30 border border-slate-600 text-slate-400 cursor-not-allowed"
                value={googleEmail}
              />
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Verified
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                required
                className="w-full p-2.5 rounded-lg bg-slate-700/50 border border-slate-600 outline-none focus:border-blue-500 transition text-white placeholder-slate-400"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full p-2.5 rounded-lg bg-slate-700/50 border border-slate-600 outline-none focus:border-blue-500 transition text-white placeholder-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Min 8 chars, uppercase, lowercase & number
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="w-full p-2.5 rounded-lg bg-slate-700/50 border border-slate-600 outline-none focus:border-blue-500 transition text-white placeholder-slate-400"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">* {error}</p>
            )}

            {success && (
              <p className="text-green-400 text-sm">Redirecting to login...</p>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Complete Signup"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-slate-400">
            <button
              onClick={() => { setStep("google"); setError(""); }}
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              ← Back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-sm text-slate-400">Sign up with Google to start tracking your DSA progress</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={triggerGoogleSignUp}
            disabled={!scriptLoadedSuccessfully || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          {error && (
            <p className="text-red-400 text-sm">* {error}</p>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <button
            onClick={goToLogin}
            className="text-blue-400 hover:text-blue-300 font-medium transition"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
