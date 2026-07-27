import { useState } from "react";
import PageHead from "../components/PageHead";
import Card from "../components/Card";

interface TeamMember {
  id: number;
  nama: string;
  nim: string;
  role: string;
  avatarBg: string;
  avatarColor: string;
  image?: string; // Path atau URL ke file gambar avatar (misal: "/team/member1.jpg")
}

function MemberAvatar({ member }: { member: TeamMember }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="relative mb-3.5 flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full border border-line shadow-inner"
      style={{ background: member.avatarBg, color: member.avatarColor }}
    >
      {member.image && !hasError ? (
        <img
          src={member.image}
          alt={member.nama}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="38"
          height="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Photo placeholder"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  );
}

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    nama: "Stieven Lee",
    nim: "2802538725",
    role: "Data Engineer I",
    avatarBg: "rgba(195, 244, 0, 0.12)",
    avatarColor: "#c3f400",
    image: "/images/stieven.jpg",
  },
  {
    id: 2,
    nama: "Calvin Martin",
    nim: "2802540686",
    role: "Data Engineer II",
    avatarBg: "rgba(125, 244, 255, 0.12)",
    avatarColor: "#7df4ff",
    image: "/images/calvin.jpg",
  },
  {
    id: 3,
    nama: "Rangga Mulia Tohpati",
    nim: "2802539854",
    role: "Pattern Analyst",
    avatarBg: "rgba(208, 188, 255, 0.12)",
    avatarColor: "#d0bcff",
    image: "/images/rangga.jpeg",
  },
  {
    id: 4,
    nama: "Randysta Rasta Putra",
    nim: "2802539835",
    role: "Segmentation Specialist",
    avatarBg: "rgba(255, 212, 121, 0.12)",
    avatarColor: "#ffd479",
    image: "/images/randys.jpg",
  },
  {
    id: 5,
    nama: "Keisha Grace Kristian",
    nim: "2802549344",
    role: "Insight Communicator",
    avatarBg: "rgba(255, 180, 171, 0.12)",
    avatarColor: "#ffb4ab",
    image: "/images/keisha.jpg",
  },
];

interface ResourceItem {
  id: number;
  title: string;
  description: string;
  link: string;
  comment?: string;
  icon: JSX.Element;
  accent: string;
}

const RESOURCES: ResourceItem[] = [
  {
    id: 1,
    title: "Project Website",
    description: "Official deployment of this project.",
    link: "https://picat.my.id",
    accent: "#c3f400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "GitHub Repository",
    description: "Source code of this project.",
    link: "https://github.com/StievenLee/Data-Mining-All-Lending-Club-loan",
    accent: "#d0bcff",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Dataset",
    description: "Dataset used in this project.",
    link: "https://www.kaggle.com/datasets/wordsforthewise/lending-club",
    accent: "#7df4ff",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

export default function About() {
  return (
    <>
      {/* 1. Header */}
      <PageHead
        eyebrow="TEAM & PROJECT INFO"
        title="About"
        sub="Information about the development team, project resources, and datasets."
        pills={[
          { label: "Kelompok", value: "Kelompok 6" },
          { label: "Tim", value: "5 Members", kind: "accent" },
        ]}
      />

      <div className="h-[18px]" />

      {/* 3. Team Members */}
      <Card
        title="Development Team"
        sub="Anggota tim yang berkontribusi dalam perancangan, analisis data, hingga pengembangan dashboard."
      >
        <div className="grid grid-cols-1 gap-3.5 min-[540px]:grid-cols-2 min-[840px]:grid-cols-3 min-[1100px]:grid-cols-5">
          {MEMBERS.map((m) => (
            <div
              key={m.id}
              className="flex flex-col items-center justify-between rounded-[18px] border border-line bg-glass2 p-5 text-center transition-transform duration-150 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center">
                {/* Avatar Image / Placeholder */}
                <MemberAvatar member={m} />

                {/* Nama Lengkap */}
                <h4 className="font-display text-[15px] font-semibold text-text">
                  {m.nama}
                </h4>

                {/* NIM */}
                <div className="mt-1 font-mono text-[12px] text-muted">
                  NIM: {m.nim}
                </div>
              </div>

              {/* Role Badge */}
              <div className="mt-4">
                <span
                  className="inline-block rounded-full border px-3 py-1 font-mono text-[10.5px] font-semibold tracking-tight"
                  style={{
                    borderColor: `${m.avatarColor}40`,
                    background: `${m.avatarBg}`,
                    color: m.avatarColor,
                  }}
                >
                  {m.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="h-[18px]" />

      {/* 4. Project Resources */}
      <Card
        title="Project Resources"
        sub="Tautan resmi ke website proyek, kode sumber repository, serta dataset yang digunakan."
      >
        <div className="grid grid-cols-1 gap-3.5 min-[720px]:grid-cols-3">
          {RESOURCES.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-[18px] border border-line bg-glass2 p-5"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-line"
                    style={{ color: r.accent, background: `${r.accent}15` }}
                  >
                    {r.icon}
                  </div>
                  <h4 className="font-display text-[16px] font-semibold text-text">
                    {r.title}
                  </h4>
                </div>
                <p className="mt-3 text-[13px] leading-[1.5] text-muted">
                  {r.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                <span
                  className="max-w-[160px] truncate font-mono text-[11px] text-muted"
                  title={r.link}
                >
                  {r.link}
                </span>
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-glass px-3.5 py-1.5 font-mono text-[12px] font-medium text-text transition-all duration-150 hover:border-lime/50 hover:bg-lime/10 hover:text-lime"
                >
                  Open
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="h-[24px]" />

      {/* 5. Footer Information */}
      <footer className="flex flex-col items-center justify-center gap-1 rounded-[18px] border border-line/50 bg-glass/60 py-6 text-center backdrop-blur-[12px]">
        <div className="font-display text-[14px] font-semibold text-text">
          Developed by Kelompok 6
        </div>
        <div className="font-mono text-[12px] text-muted">
          Data Mining Dashboard Project
        </div>
        <div className="font-mono text-[11px] tracking-wider text-lime">
          2026
        </div>
      </footer>
    </>
  );
}
