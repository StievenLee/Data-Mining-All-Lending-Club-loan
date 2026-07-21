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
    <div className="relative mb-[18px] overflow-hidden rounded-[20px] border border-violet/20 bg-[linear-gradient(110deg,rgba(87,27,193,0.35),rgba(19,19,24,0.55)_72%)] px-4 py-4 backdrop-blur-[10px] min-[640px]:rounded-[26px] min-[640px]:px-7 min-[640px]:py-6">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(195,244,0,0.12),transparent_70%)]" />
      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted min-[640px]:mb-3 min-[640px]:text-[11px]">
        {eyebrow}
      </p>
      <p className="relative max-w-[82ch] text-[15px] leading-[1.5] text-text [&_b]:font-semibold [&_b]:text-lime min-[640px]:text-[19px] min-[640px]:leading-[1.55]">
        {children}
      </p>
    </div>
  );
}
