"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center">
        <h2 className="mb-4 text-2xl font-semibold text-white">Something went wrong!</h2>
        <p className="mb-6 text-white/70">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={reset}
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

