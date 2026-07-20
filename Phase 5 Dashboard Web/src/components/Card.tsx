import type { ReactNode } from "react";

interface Props {
  title?: string;
  note?: string;
  sub?: string;
  children: ReactNode;
}

export default function Card({ title, note, sub, children }: Props) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[26px] border border-line bg-glass px-[26px] py-6 backdrop-blur-[24px] before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-[26px] before:bg-[linear-gradient(90deg,rgba(255,255,255,0.26),transparent_60%)] before:content-['']">
      {(title || note) && (
        <div className="mb-1 flex items-center justify-between gap-3.5">
          {title && (
            <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">{title}</h3>
          )}
          {note && <span className="font-mono text-[11px] text-muted">{note}</span>}
        </div>
      )}
      {sub && <p className="mb-3.5 mt-0.5 text-[13px] leading-[1.5] text-muted">{sub}</p>}
      {children}
    </section>
  );
}
