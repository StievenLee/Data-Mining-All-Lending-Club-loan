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

export default function PageHead({ eyebrow, title, sub, pills }: Props) {
  return (
    <div className="page-head">
      <div className="page-head-text">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
      {pills && pills.length > 0 && (
        <div className="pill-row">
          {pills.map((p) => (
            <div key={p.label} className={`pill${p.kind ? " " + p.kind : ""}`}>
              <div className="pill-label">{p.label}</div>
              <div className="pill-value">{p.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
