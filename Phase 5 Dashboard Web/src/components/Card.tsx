import type { ReactNode } from "react";

interface Props {
  title?: string;
  note?: string;
  sub?: string;
  children: ReactNode;
}

export default function Card({ title, note, sub, children }: Props) {
  return (
    <section className="card">
      {(title || note) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {note && <span className="card-note">{note}</span>}
        </div>
      )}
      {sub && <p className="card-sub">{sub}</p>}
      {children}
    </section>
  );
}
