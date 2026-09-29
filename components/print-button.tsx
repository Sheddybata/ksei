"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy"
    >
      Print card
    </button>
  );
}
