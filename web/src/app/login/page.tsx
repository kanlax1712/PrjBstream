"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const callbackUrl = params.get("callbackUrl") ?? "/";
  const registered = params.get("registered") === "true";

  useEffect(() => {
    if (registered) {
      // Use setTimeout to avoid setting state synchronously in effect
      const timer = setTimeout(() => {
        setSuccess("Account created successfully! Please sign in.");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [registered]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    // Client-side validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    startTransition(async () => {
      const response = await signIn("credentials", {
        email: email.toLowerCase().trim(), // Sanitize email client-side
        password,
        redirect: false,
      });

      if (response?.error) {
        setError(response.error);
        return;
      }

      router.push(callbackUrl);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-white/5 p-8 text-white shadow-2xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Bstream
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-white/60">
            Sign in to your Bstream account
          </p>
        </div>
        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {success}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-cyan-300 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
