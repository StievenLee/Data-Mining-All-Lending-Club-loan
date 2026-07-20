import { useDashboard } from "../../store/useDashboard";

export default function DatasetToggle() {
  const dataset = useDashboard((s) => s.dataset);
  const setDataset = useDashboard((s) => s.setDataset);
  return (
    <div className="seg" role="group" aria-label="Pilih dataset">
      <button
        className={dataset === "accepted" ? "on" : ""}
        onClick={() => setDataset("accepted")}
      >
        Accepted
      </button>
      <button
        className={dataset === "rejected" ? "on" : ""}
        onClick={() => setDataset("rejected")}
      >
        Rejected
      </button>
    </div>
  );
}
