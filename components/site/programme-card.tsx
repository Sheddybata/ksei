"use client";

import Link from "next/link";
import { useState } from "react";

const previewLength = 160;

export function ProgrammeHero({ title, overview, image }: { title: string; overview: string; image: string }) {
  const [open, setOpen] = useState(false);
  const long = overview.length > previewLength;
  const preview = long ? `${overview.slice(0, previewLength).trimEnd()}…` : overview;

  return (
    <section
      className="flex min-h-[340px] flex-col justify-end bg-navy bg-cover bg-center px-4 py-12 text-ivory"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(12,42,67,0.96) 0%, rgba(18,59,93,0.78) 48%, rgba(18,59,93,0.3) 100%), url("${image}")`,
      }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">You are applying for</p>
        <h1 className="mt-2 font-display text-5xl leading-tight">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ivory/90">{open || !long ? overview : preview}</p>
        {long ? (
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-gold"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? ".....show less" : ".....read more"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ProgrammeCard({
  title,
  overview,
  image,
  applyHref,
  kicker,
  documentHref,
}: {
  title: string;
  overview: string;
  image: string;
  applyHref: string;
  kicker?: string;
  documentHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const long = overview.length > previewLength;
  const preview = long ? `${overview.slice(0, previewLength).trimEnd()}…` : overview;

  return (
    <article
      className="flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-navy bg-cover bg-center p-6 text-ivory shadow-card"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(12,42,67,0.96) 0%, rgba(18,59,93,0.82) 46%, rgba(18,59,93,0.28) 100%), url("${image}")`,
      }}
    >
      {kicker ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{kicker}</p> : null}
      <h3 className="font-display text-3xl leading-tight text-ivory">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ivory/90">{open || !long ? overview : preview}</p>
      {long ? (
        <button
          type="button"
          className="mt-2 w-fit text-left text-sm font-semibold text-gold"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? ".....show less" : ".....read more"}
        </button>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href={applyHref} className="text-gold">
          Apply to this programme
        </Link>
        {documentHref ? (
          <a className="text-ivory" href={documentHref}>
            Open the programme document
          </a>
        ) : null}
      </div>
    </article>
  );
}
