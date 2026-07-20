import type { ReactNode } from "react";

/** Box insight bertema violet (aksen "kecerdasan/AI"). Highlight lime via <b>. */
export default function Callout({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="relative mb-[18px] overflow-hidden rounded-[26px] border border-violet/20 bg-[linear-gradient(110deg,rgba(87,27,193,0.35),rgba(19,19,24,0.55)_72%)] px-7 py-6 backdrop-blur-[10px]">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(195,244,0,0.12),transparent_70%)]" />
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {eyebrow}
      </p>
      <p className="relative max-w-[82ch] text-[19px] leading-[1.55] text-text [&_b]:font-semibold [&_b]:text-lime">
        {children}
      </p>
    </div>
  );
}
