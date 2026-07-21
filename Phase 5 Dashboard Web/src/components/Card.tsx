import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  note?: string;
  sub?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, note, sub, children }: Props) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[18px] border border-line bg-glass px-4 py-4 backdrop-blur-[24px] before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-[18px] before:bg-[linear-gradient(90deg,rgba(255,255,255,0.26),transparent_60%)] before:content-[''] min-[640px]:rounded-[26px] min-[640px]:px-[26px] min-[640px]:py-6 min-[640px]:before:rounded-t-[26px]">
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
