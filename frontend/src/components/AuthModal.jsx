import { useEffect, useState } from "react";
import { X, Shield, Mail, Lock, User, ArrowRight } from "lucide-react";

const initialForm = { name: "", email: "", password: "" };

function AuthPanel({ mode, onClose, onSubmit }) {
  const [formMode, setFormMode] = useState(mode || "login");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setFormMode(mode || "login");
    setForm(initialForm);
  }, [mode]);

  const isSignup = formMode === "signup";

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      mode: formMode,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });
  };

  const handleSocialAuth = (provider) => {
    const providerLabel = provider === "google" ? "Google" : "Facebook";
    onSubmit({
      mode: formMode,
      provider,
      name: `${providerLabel} User`,
      email: `${providerLabel.toLowerCase().replace(/\s+/g, "")}@deepshield.local`,
      password: "",
    });
  };

  return (
    <div className="relative z-[61] w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:max-w-[400px]">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-300">
          <Shield size={18} />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">DeepShield Access</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:text-slate-300 dark:hover:text-cyan-300"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pb-5 pt-3">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {isSignup ? "Sign Up" : "Login"}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {isSignup
            ? "Create your account with Google, Facebook, or email."
            : "Continue with Google, Facebook, or your email address."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSocialAuth("facebook")}
            aria-label="Continue with Facebook"
            className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition-transform hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/60"
          >
            <FacebookMark />
          </button>
          <button
            type="button"
            onClick={() => handleSocialAuth("google")}
            aria-label="Continue with Google"
            className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition-transform hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/60"
          >
            <GoogleMark />
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span>or use email</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={() => setFormMode("login")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              formMode === "login"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setFormMode("signup")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              formMode === "signup"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {isSignup && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Full name</span>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-cyan-400 dark:border-slate-600 dark:bg-slate-900/70">
                <User size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Jane Doe"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  autoComplete="name"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-cyan-400 dark:border-slate-600 dark:bg-slate-900/70">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-cyan-400 dark:border-slate-600 dark:bg-slate-900/70">
              <Lock size={16} className="text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder={isSignup ? "Create a password" : "Enter your password"}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
              />
            </div>
          </label>

          {!isSignup && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <button type="button" className="text-cyan-600 transition-colors hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200">
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setFormMode("signup")}
                className="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Create an account
              </button>
            </div>
          )}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 sm:text-sm"
          >
            {isSignup ? "Sign Up" : "Login"}
            <ArrowRight size={13} />
          </button>

          {isSignup && (
            <p className="text-center text-[11px] leading-4 text-slate-500 dark:text-slate-400">
              By signing up you accept our <button type="button" className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-300">terms of service</button>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function AuthModal({ open, mode, onClose, onSubmit, variant = "modal" }) {
  if (!open) return null;

  if (variant === "page") {
    return (
      <section className="min-h-[calc(100vh-5rem)] rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">DeepShield Access</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {mode === "signup"
                ? "Set up a DeepShield account to save scans and keep your workflow organized."
                : "Log in to continue where you left off and review your saved analysis history."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-cyan-300"
          >
            Back to dashboard
          </button>
        </div>

        <div className="flex justify-center">
          <AuthPanel mode={mode} onClose={onClose} onSubmit={onSubmit} />
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 py-4 sm:px-4">
      <button
        type="button"
        aria-label="Close authentication dialog"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <AuthPanel mode={mode} onClose={onClose} onSubmit={onSubmit} />
    </div>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.101 4.388 23.093 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.973H15.82c-1.491 0-1.955.93-1.955 1.884v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.101 24 12.073Z" fill="#1877F2" />
      <path d="M16.593 15.563 17.125 12h-3.328V9.736c0-.954.464-1.884 1.955-1.884h1.511V4.879s-1.374-.235-2.686-.235c-2.741 0-4.533 1.671-4.533 4.697V12H7.078v3.49h2.966V24a12.1 12.1 0 0 0 2.304 0v-8.437h2.245Z" fill="#fff" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none">
      <path d="M23.49 12.272c0-.818-.073-1.6-.21-2.364H12v4.47h6.47a5.54 5.54 0 0 1-2.399 3.632v3.018h3.874c2.264-2.086 3.565-5.16 3.565-8.756Z" fill="#4285F4" />
      <path d="M12 24c3.24 0 5.956-1.074 7.942-2.912l-3.874-3.018c-1.074.72-2.447 1.15-4.068 1.15-3.132 0-5.787-2.113-6.735-4.954H1.277v3.11A11.99 11.99 0 0 0 12 24Z" fill="#34A853" />
      <path d="M5.265 14.266A7.19 7.19 0 0 1 4.87 12c0-.788.136-1.55.395-2.266v-3.11H1.277A11.99 11.99 0 0 0 0 12c0 1.936.463 3.76 1.277 5.376l3.988-3.11Z" fill="#FBBC05" />
      <path d="M12 4.756c1.764 0 3.349.607 4.597 1.798l3.447-3.447C17.953 1.202 15.238 0 12 0A11.99 11.99 0 0 0 1.277 6.624l3.988 3.11C6.213 6.87 8.868 4.756 12 4.756Z" fill="#EA4335" />
    </svg>
  );
}
