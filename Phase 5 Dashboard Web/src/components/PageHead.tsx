import type { ReactNode } from "react";

export interface PillData {
  label: string;
  value: string;
  kind?: "accent" | "ai";
}

interface Props {
  eyebrow: string;
  title: string;
  sub: ReactNode;
  pills?: PillData[];
}

const PILL_VALUE_COLOR = {
  accent: "text-lime",
  ai: "text-violet",
  default: "text-text",
} as const;

export default function PageHead({ eyebrow, title, sub, pills }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0 flex-1 basis-[340px]">
        <p className="mb-2.5 font-mono text-[11.5px] uppercase tracking-[0.16em] text-lime">
          {eyebrow}
        </p>
        <h1 className="m-0 font-display text-[clamp(24px,7vw,44px)] font-bold leading-[1.03] tracking-[-0.025em] min-[640px]:text-[clamp(28px,3.2vw,44px)]">
          {title}
        </h1>
        <p className="mt-3.5 max-w-[58ch] text-[14.5px] leading-[1.6] text-muted [&_b]:font-semibold [&_b]:text-lime">
          {sub}
        </p>
      </div>
      {pills && pills.length > 0 && (
        <div className="flex flex-[0_1_auto] flex-wrap gap-2.5 min-[640px]:justify-end min-[640px]:gap-3.5">
          {pills.map((p) => (
            <div
              key={p.label}
              className="min-w-[100px] rounded-2xl border border-line bg-glass px-3.5 py-2.5 backdrop-blur-[20px] min-[640px]:min-w-[120px] min-[640px]:rounded-[20px] min-[640px]:px-5 min-[640px]:py-[15px]"
            >
              <div className="font-mono text-[10px] uppercase leading-[1.4] tracking-[0.09em] text-muted">
                {p.label}
              </div>
              <div
                className={
                  "mt-1.5 font-mono text-lg font-bold leading-none min-[640px]:mt-2 min-[640px]:text-[25px] " +
                  PILL_VALUE_COLOR[p.kind ?? "default"]
                }
              >
                {p.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
