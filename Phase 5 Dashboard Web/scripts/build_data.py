"""
build_data.py — Pipeline data build-time untuk dashboard web statis (Fase 5 Web).

Membaca output NYATA Fase 1-4, lalu menulis file KECIL ke public/data/ agar seluruh
filter bisa dikerjakan di browser (<100ms) tanpa server.

Prinsip:
- Data mentah/berat (rejected 805 MB) TIDAK dikirim ke browser. Di sini diagregasi &
  di-sample dulu.
- Aturan sampling meniru dashboard lama: baris tier kuat dipertahankan, sisanya di-sample
  sampai total ~6.000 baris. Rejected difilter ke tier >= "Kuat".
- Bila file asli belum ada, fungsi memakai fallback dummy berskema sama.

Input   :  data_src/ (CSV/parquet/dbscan-json Fase 1-4, gitignored, non-public)
Jalankan:  python scripts/build_data.py
Output  :  public/data/{summary,tiers_by_year,verdict_by_year,clusters,clusters_by_year,rules}.json
           public/data/anomaly_sample_{accepted,rejected}.json
"""
from __future__ import annotations
import json
import os
import re

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Path
# ---------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
WEB_ROOT = os.path.dirname(HERE)                       # Phase 5 Dashboard Web/
PROJECT_ROOT = os.path.dirname(WEB_ROOT)               # repo root
DATA_IN = os.path.join(WEB_ROOT, "data_src")           # input Fase 1-4 (gitignored, non-public)
OUT_DIR = os.path.join(WEB_ROOT, "public", "data")     # JSON hasil (di-deploy sbg aset statis)

ANOMALY_ACC = os.path.join(DATA_IN, "anomaly_report_accepted.csv")
ANOMALY_REJ = os.path.join(DATA_IN, "anomaly_report_rejected.csv")
CLUSTER_CSV = os.path.join(DATA_IN, "cluster_profiles.csv")
RULES_ACC_CSV = os.path.join(PROJECT_ROOT, "Phase 3 Associate Rule", "Results",
                             "results_apriori_accepted.csv")     # Fase 3 (accepted)
RULES_REJ_CSV = os.path.join(PROJECT_ROOT, "Phase 3 Associate Rule", "Results",
                             "results_apriori_rejected.csv")     # Fase 3 (rejected)
DBSCAN_ACC_JSON = os.path.join(DATA_IN, "dbscan_outliers_accepted.json")
DBSCAN_REJ_JSON = os.path.join(DATA_IN, "dbscan_outliers_rejected.json")

# Sumber utk agregasi klaster PER TAHUN (populasi penuh accepted, join per posisi baris).
CLEAN_ACC_CSV = os.path.join(PROJECT_ROOT, "Datasets", "Cleaning", "Phase 2", "clean_accepted_loans.csv")
CLUSTER_LABELS_PARQUET = os.path.join(PROJECT_ROOT, "Phase 2 Clustering", "Results", "cluster_labels_accepted.parquet")
ISSUE_YEAR_PARQUET = os.path.join(PROJECT_ROOT, "Datasets", "Cleaning", "Phase 2", "issue_year_accepted.parquet")

# ---------------------------------------------------------------------------
# Konstanta (selaras dashboard lama)
# ---------------------------------------------------------------------------
REJECTED_MIN_TIER_RANK = 2      # rejected: hanya muat tier <= rank ini (0=Kritis..)
MAX_TOTAL_MB = 50.0              # ambang validasi ukuran total output (scatter tanpa sampling, selaras Dash)

TIER_ORDER = [
    "Kritis (DBSCAN + 3 metode)",
    "Sangat Kuat (DBSCAN + metode)",
    "Kuat (3 metode)",
    "Sedang (2 metode)",
    "Lemah (1 metode)",
]
TIER_RANK = {t: i for i, t in enumerate(TIER_ORDER)}

FEATURES = {
    "accepted": ["int_rate", "fico_range_low", "installment",
                 "acc_open_past_24mths", "num_tl_op_past_12m"],
    "rejected": ["Amount Requested", "Debt-To-Income Ratio", "Employment Length"],
}

RNG = np.random.default_rng(42)


# ---------------------------------------------------------------------------
# Util
# ---------------------------------------------------------------------------
def log(msg: str) -> None:
    print(f"[build_data] {msg}")


def dbscan_meta(dataset: str) -> dict:
    path = DBSCAN_ACC_JSON if dataset == "accepted" else DBSCAN_REJ_JSON
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {"n_noise": 0, "pct_noise": 0.0, "eps": 0.0, "sample_size": 0}


def dedupe_year(df: pd.DataFrame) -> pd.DataFrame:
    """CSV accepted punya kolom 'year' dobel -> pandas jadi year, year.1. Buang duplikat."""
    if "year.1" in df.columns:
        df = df.drop(columns=["year.1"])
    return df


def sample_scatter(df: pd.DataFrame, feats: list[str]) -> pd.DataFrame:
    """TANPA sampling: seluruh titik terfilter dikirim (selaras dashboard Dash
    terbaru, yang juga menggambar semua titik). CATATAN: terbukti bikin browser
    klien lag/freeze saat ganti dataset (rebuild+render ratusan ribu titik canvas
    tiap re-render) -- dipertahankan begini atas permintaan eksplisit."""
    keep_cols = [c for c in feats + ["iso_score", "anomaly_tier", "is_dbscan_noise",
                                     "is_contextual_outlier", "is_collective_outlier",
                                     "auto_verdict", "year"]
                 if c in df.columns]
    return df[keep_cols].dropna(subset=[c for c in feats if c in df.columns], how="all")


# ---------------------------------------------------------------------------
# Dummy fallback (dipakai bila CSV asli tak ada)
# ---------------------------------------------------------------------------
def dummy_anomaly(dataset: str, n=4000) -> pd.DataFrame:
    feats = FEATURES[dataset]
    df = pd.DataFrame({f: RNG.normal(0, 1, n) for f in feats})
    df["iso_score"] = RNG.uniform(0.45, 0.82, n)
    df["n_methods_flag"] = RNG.choice([1, 2, 3], n, p=[0.60, 0.27, 0.13])
    df["is_dbscan_noise"] = RNG.random(n) < 0.015
    tier = np.array(["Lemah (1 metode)"] * n, dtype=object)
    tier[df["n_methods_flag"] == 2] = "Sedang (2 metode)"
    tier[df["n_methods_flag"] == 3] = "Kuat (3 metode)"
    tier[df["is_dbscan_noise"]] = "Sangat Kuat (DBSCAN + metode)"
    tier[df["is_dbscan_noise"] & (df["n_methods_flag"] == 3)] = "Kritis (DBSCAN + 3 metode)"
    df["anomaly_tier"] = tier
    df["year"] = RNG.integers(2012, 2019, n)
    if dataset == "accepted":
        df["auto_verdict"] = RNG.choice(
            ["Kasus Langka (Sah)", "Sinyal Risiko", "Kesalahan Data"],
            n, p=[0.775, 0.222, 0.003])
    return df


def dummy_rules() -> pd.DataFrame:
    rows = [
        ("dti Low + bunga Very Low + term 36", "grade A + Fully Paid", 0.067, 0.946, 5.771),
        ("income Mid + bunga Very Low", "grade A + Fully Paid", 0.057, 0.943, 5.758),
        ("bunga Very Low + Fully Paid", "grade A + term 36", 0.142, 0.977, 5.754),
        ("bunga Very Low + loan Medium", "grade A + Fully Paid", 0.054, 0.943, 5.754),
        ("bunga High + term 36", "grade D", 0.075, 0.765, 5.111),
        ("home RENT + bunga High", "grade D", 0.052, 0.718, 4.797),
        ("bunga High + Fully Paid", "grade D", 0.083, 0.716, 4.784),
        ("income Mid + bunga Low", "grade B + MORTGAGE", 0.052, 0.503, 3.454),
        ("bunga Low + loan Small + Fully Paid", "grade B + term 36", 0.071, 0.879, 3.434),
        ("bunga Low + loan Small", "grade B + term 36", 0.081, 0.879, 3.432),
        ("DTI Very Low + kerja Junior", "Amount Small (<5K)", 0.117, 0.481, 1.331),
        ("DTI Very Low", "Amount Small (<5K)", 0.137, 0.479, 1.324),
        ("DTI Very High", "Amount Large", 0.080, 0.370, 1.317),
        ("DTI Very High + kerja Junior", "Amount Large", 0.074, 0.367, 1.309),
    ]
    df = pd.DataFrame(rows, columns=["antecedent", "consequent", "support", "confidence", "lift"])
    df["dataset"] = ["Accepted"] * 10 + ["Rejected"] * 4
    return df.sort_values("lift", ascending=False).reset_index(drop=True)


# ---------------------------------------------------------------------------
# Pemroses per dataset
# ---------------------------------------------------------------------------
def process_accepted() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Return (tier_by_year, verdict_by_year, scatter_sample) untuk accepted."""
    if not os.path.exists(ANOMALY_ACC):
        log("anomaly accepted: file tidak ada -> DUMMY")
        df = dummy_anomaly("accepted")
    else:
        log(f"membaca {ANOMALY_ACC} ...")
        df = pd.read_csv(ANOMALY_ACC)
        df = dedupe_year(df)
        log(f"  accepted: {len(df):,} baris")

    tby = (df.groupby(["year", "anomaly_tier"]).size()
           .reset_index(name="count"))
    if "auto_verdict" in df.columns:
        vby = (df.groupby(["year", "auto_verdict"]).size()
               .reset_index(name="count"))
    else:
        vby = pd.DataFrame(columns=["year", "auto_verdict", "count"])
    scat = sample_scatter(df, FEATURES["accepted"])
    return tby, vby, scat


def process_rejected() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (tier_by_year, scatter_sample) untuk rejected (805 MB -> chunked)."""
    if not os.path.exists(ANOMALY_REJ):
        log("anomaly rejected: file tidak ada -> DUMMY")
        df = dummy_anomaly("rejected", n=3000)
        tby = df.groupby(["year", "anomaly_tier"]).size().reset_index(name="count")
        return tby, sample_scatter(df, FEATURES["rejected"])

    log(f"membaca {ANOMALY_REJ} secara chunk (805 MB, hemat memori) ...")
    usecols = FEATURES["rejected"] + ["iso_score", "anomaly_tier", "is_dbscan_noise", "year"]
    tier_year_counts: dict[tuple, int] = {}
    strong_chunks: list[pd.DataFrame] = []
    total = 0
    for i, chunk in enumerate(pd.read_csv(ANOMALY_REJ, usecols=usecols, chunksize=500_000)):
        total += len(chunk)
        # Rejected disamakan dg dashboard Dash lama: HANYA tier kuat (rank<=REJECTED_MIN_TIER_RANK)
        # yang dihitung — baik utk KPI/gauge maupun scatter. Sehingga "% bukti kuat" rejected = 100%
        # (semua baris rejected yang ditampilkan memang sudah tier kuat), konsisten dg Dash.
        strong = chunk[chunk["anomaly_tier"].map(TIER_RANK).fillna(99) <= REJECTED_MIN_TIER_RANK]
        for (yr, tier), c in strong.groupby(["year", "anomaly_tier"]).size().items():
            tier_year_counts[(yr, tier)] = tier_year_counts.get((yr, tier), 0) + int(c)
        if len(strong):
            strong_chunks.append(strong)
        if (i + 1) % 10 == 0:
            log(f"  ...{total:,} baris diproses")
    log(f"  rejected total: {total:,} baris")

    tby = pd.DataFrame(
        [(yr, tier, c) for (yr, tier), c in tier_year_counts.items()],
        columns=["year", "anomaly_tier", "count"])
    strong_df = (pd.concat(strong_chunks, ignore_index=True)
                 if strong_chunks else pd.DataFrame(columns=usecols))
    log(f"  rejected tier>=Kuat: {len(strong_df):,} baris -> sampling")
    return tby, sample_scatter(strong_df, FEATURES["rejected"])


def process_clusters() -> list[dict]:
    if os.path.exists(CLUSTER_CSV):
        df = pd.read_csv(CLUSTER_CSV)
        log(f"cluster profiles: {len(df)} klaster dari CSV")
    else:
        log("cluster profiles: DUMMY")
        df = pd.DataFrame({
            "cluster": [0, 1, 2],
            "nama_profil": ["Prime / Low-Risk", "Moderate-Risk", "High-Risk"],
            "n_anggota": [512208, 488402, 347489],
            "default_rate": [0.1165, 0.1919, 0.3337],
            "avg_int_rate": [10.4, 12.9, 17.8],
            "avg_fico": [700, 683, 668],
        })
    return df.to_dict(orient="records")


def clean_itemset(val) -> str:
    """Ubah 'frozenset({'A', 'B'})' (format rejected) -> 'A, B'. Accepted sudah rapi
    (mis. 'grade_A, term_36') jadi dikembalikan apa adanya."""
    s = str(val).strip()
    m = re.match(r"^frozenset\(\{(.*)\}\)$", s)
    if m:
        s = m.group(1)
    items = [it.strip().strip("'\"") for it in s.split(",")]
    return ", ".join(i for i in items if i)


def read_rules_csv(path: str, dataset: str) -> pd.DataFrame | None:
    if not os.path.exists(path):
        return None
    df = pd.read_csv(path).rename(columns={"antecedents": "antecedent",
                                           "consequents": "consequent"})
    df["antecedent"] = df["antecedent"].map(clean_itemset)
    df["consequent"] = df["consequent"].map(clean_itemset)
    df["dataset"] = dataset
    log(f"rules {dataset}: {len(df)} rule dari CSV")
    return df[["antecedent", "consequent", "support", "confidence", "lift", "dataset"]]


def process_rules() -> list[dict]:
    parts = [d for d in (read_rules_csv(RULES_ACC_CSV, "Accepted"),
                         read_rules_csv(RULES_REJ_CSV, "Rejected")) if d is not None]
    if not parts:
        log("rules: Fase 3 belum diekspor -> DUMMY (menyerupai hasil nyata)")
        return dummy_rules().to_dict(orient="records")
    df = (pd.concat(parts, ignore_index=True)
          .sort_values("lift", ascending=False).reset_index(drop=True))
    return df.to_dict(orient="records")


def process_clusters_by_year() -> list[dict]:
    """Agregasi profil klaster PER (tahun, klaster) dari populasi penuh accepted.
    Join tiga sumber sejajar posisi baris (1.35jt): clean_accepted (fitur+loan_status),
    cluster_labels (Cluster_Label), issue_year (tahun). Nama profil diturunkan dari
    urutan default rate (terendah=Prime) agar robust terhadap penomoran label K-Means."""
    src = [CLEAN_ACC_CSV, CLUSTER_LABELS_PARQUET, ISSUE_YEAR_PARQUET]
    if not all(os.path.exists(p) for p in src):
        log("clusters_by_year: sumber populasi penuh tak lengkap -> lewati (kartu segmen tetap agregat)")
        return []
    log("clusters_by_year: join populasi penuh (1.35jt) & agregasi per tahun ...")
    acc = pd.read_csv(CLEAN_ACC_CSV, usecols=["int_rate", "fico_range_low", "loan_status_binary"])
    cl = pd.read_parquet(CLUSTER_LABELS_PARQUET).sort_values("orig_row_pos").reset_index(drop=True)
    yr = pd.read_parquet(ISSUE_YEAR_PARQUET).sort_values("row_pos").reset_index(drop=True)
    n = len(acc)
    if not (len(cl) == n and len(yr) == n):
        log(f"  ukuran tak cocok ({n}/{len(cl)}/{len(yr)}) -> lewati")
        return []
    acc = acc.reset_index(drop=True)
    acc["cluster"] = cl["Cluster_Label"].astype(int).to_numpy()
    acc["year"] = yr["issue_year"].astype(int).to_numpy()

    # nama profil dari peringkat default rate overall (terendah -> Prime)
    rank_names = ["Prime / Low-Risk", "Moderate-Risk", "High-Risk"]
    order = acc.groupby("cluster")["loan_status_binary"].mean().sort_values().index.tolist()
    name_by_cluster = {c: rank_names[i] if i < len(rank_names) else f"Cluster {c}"
                       for i, c in enumerate(order)}

    g = acc.groupby(["year", "cluster"]).agg(
        n_anggota=("loan_status_binary", "size"),
        default_rate=("loan_status_binary", "mean"),
        avg_int_rate=("int_rate", "mean"),
        avg_fico=("fico_range_low", "mean"),
    ).reset_index()
    out = []
    for _, r in g.iterrows():
        c = int(r["cluster"])
        out.append({
            "year": int(r["year"]),
            "cluster": c,
            "nama_profil": name_by_cluster.get(c, f"Cluster {c}"),
            "n_anggota": int(r["n_anggota"]),
            "default_rate": round(float(r["default_rate"]), 4),
            "avg_int_rate": round(float(r["avg_int_rate"]), 3),
            "avg_fico": round(float(r["avg_fico"]), 3),
        })
    log(f"  clusters_by_year: {len(out)} baris (tahun x klaster)")
    return out


# ---------------------------------------------------------------------------
# Penulisan output
# ---------------------------------------------------------------------------
def tier_year_to_records(df: pd.DataFrame, dataset: str) -> list[dict]:
    out = df.copy()
    out["dataset"] = dataset
    out["year"] = out["year"].astype(int)
    out["count"] = out["count"].astype(int)
    return out[["dataset", "year", "anomaly_tier", "count"]].to_dict(orient="records")


def write_json(name: str, obj) -> None:
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    log(f"  tulis {name} ({os.path.getsize(path)/1024:.1f} KB)")


def write_sample_json(name: str, df: pd.DataFrame) -> None:
    """Sample scatter -> JSON COLUMNAR {n, columns:{col:[...]}} agar ringkas & cepat."""
    path = os.path.join(OUT_DIR, name)
    out = df.copy()
    cols: dict[str, list] = {}
    for c in out.columns:
        s = out[c]
        if s.dtype == bool:
            cols[c] = s.astype("int8").tolist()
        elif s.dtype.kind == "f":
            cols[c] = s.round(4).tolist()
        elif c == "year":
            cols[c] = pd.to_numeric(s, errors="coerce").astype("Int64").tolist()
        else:
            cols[c] = s.astype(str).tolist()
    payload = {"n": len(out), "columns": cols}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    log(f"  tulis {name} ({os.path.getsize(path)/1024:.1f} KB, {len(df):,} baris)")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    log(f"output -> {OUT_DIR}")

    acc_tby, acc_vby, acc_scat = process_accepted()
    rej_tby, rej_scat = process_rejected()
    clusters = process_clusters()
    clusters_by_year = process_clusters_by_year()
    rules = process_rules()

    meta_acc = dbscan_meta("accepted")
    meta_rej = dbscan_meta("rejected")

    # --- tiers_by_year (gabungan accepted + rejected) ---
    tiers = (tier_year_to_records(acc_tby, "accepted")
             + tier_year_to_records(rej_tby, "rejected"))
    write_json("tiers_by_year.json", tiers)

    # --- verdict_by_year (accepted saja) ---
    vby = acc_vby.copy()
    if len(vby):
        vby["year"] = vby["year"].astype(int)
        vby["count"] = vby["count"].astype(int)
    write_json("verdict_by_year.json", vby.to_dict(orient="records"))

    # --- clusters & rules ---
    write_json("clusters.json", clusters)
    write_json("clusters_by_year.json", clusters_by_year)
    write_json("rules.json", rules)

    # --- year bounds & KPI summary ---
    all_years = [r["year"] for r in tiers]
    year_bounds = [min(all_years), max(all_years)] if all_years else None

    def crit_count(records, dataset):
        return sum(r["count"] for r in records
                   if r["dataset"] == dataset
                   and r["anomaly_tier"] == "Kritis (DBSCAN + 3 metode)")

    summary = {
        "year_bounds": year_bounds,
        "features": FEATURES,
        "tier_order": TIER_ORDER,
        "kpi": {
            "total_anomali_acc": int(sum(r["count"] for r in tiers if r["dataset"] == "accepted")),
            "kritis_acc": crit_count(tiers, "accepted"),
            "kritis_rej": crit_count(tiers, "rejected"),
            "n_rules": len(rules),
            "max_lift": max((r.get("lift", 0) or 0) for r in rules) if rules else 0.0,
            "dbscan_noise_acc": int(meta_acc.get("n_noise", 0)),
        },
        "dbscan": {"accepted": meta_acc, "rejected": meta_rej},
    }
    write_json("summary.json", summary)

    # --- scatter sample (JSON ringkas) ---
    write_sample_json("anomaly_sample_accepted.json", acc_scat.reset_index(drop=True))
    write_sample_json("anomaly_sample_rejected.json", rej_scat.reset_index(drop=True))

    # --- validasi ukuran total (hanya JSON output yang di-deploy) ---
    total_mb = sum(os.path.getsize(os.path.join(OUT_DIR, f))
                   for f in os.listdir(OUT_DIR)
                   if f.endswith(".json")) / (1024 * 1024)
    log(f"TOTAL output: {total_mb:.2f} MB (ambang {MAX_TOTAL_MB} MB)")
    if total_mb > MAX_TOTAL_MB:
        log("PERINGATAN: output > ambang. Pertimbangkan agregasi lebih agresif.")
    else:
        log("OK — ukuran dalam anggaran.")


if __name__ == "__main__":
    main()
