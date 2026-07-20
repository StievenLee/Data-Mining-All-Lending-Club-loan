import type { TabId } from "../../types";

// Path ikon per tab (diambil dari dashboard Dash lama, gaya line/stroke).
const PATHS: Record<TabId, JSX.Element> = {
  ringkasan: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </>
  ),
  segmentasi: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  rules: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6 8v3a2 2 0 002 2h8a2 2 0 002-2V8M12 13v3" />
    </>
  ),
  anomali: (
    <>
      <circle cx="11" cy="11" r="6" />
      <line x1="15.5" y1="15.5" x2="20" y2="20" />
      <line x1="11" y1="8.5" x2="11" y2="11.5" />
    </>
  ),
};

export default function NavIcon({ tab, className }: { tab: TabId; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[tab]}
    </svg>
  );
}
