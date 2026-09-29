"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <h1 className="font-display text-4xl text-navy">The portal hit a snag.</h1>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-ivory">
        Try again
      </button>
    </main>
  );
}
