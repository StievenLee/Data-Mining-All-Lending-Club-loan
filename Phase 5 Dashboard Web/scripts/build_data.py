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

Jalankan:  python scripts/build_data.py
Output  :  public/data/{summary,tiers_by_year,clusters,rules}.json
           public/data/anomaly_sample_{accepted,rejected}.arrow
"""
from __future__ import annotations
import json
import os

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Path
# ---------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
WEB_ROOT = os.path.dirname(HERE)                       # Phase 5 Dashboard Web/
PROJECT_ROOT = os.path.dirname(WEB_ROOT)               # repo root
OLD_DASH = os.path.join(PROJECT_ROOT, "Phase 5 Dashboard")
DATA_IN = os.path.join(OLD_DASH, "data")               # CSV asli Fase 4 (gitignored)
OUT_DIR = os.path.join(WEB_ROOT, "public", "data")

ANOMALY_ACC = os.path.join(DATA_IN, "anomaly_report_accepted.csv")
ANOMALY_REJ = os.path.join(DATA_IN, "anomaly_report_rejected.csv")
CLUSTER_CSV = os.path.join(DATA_IN, "cluster_profiles.csv")
RULES_CSV = os.path.join(DATA_IN, "results_apriori_cleaned.csv")   # Fase 3 (opsional)
DBSCAN_ACC_JSON = os.path.join(OLD_DASH, "dbscan_outliers_accepted.json")
DBSCAN_REJ_JSON = os.path.join(OLD_DASH, "dbscan_outliers_rejected.json")

# ---------------------------------------------------------------------------
# Konstanta (selaras dashboard lama)
# ---------------------------------------------------------------------------
SCATTER_SAMPLE = 6000
REJECTED_MIN_TIER_RANK = 2      # rejected: hanya muat tier <= rank ini (0=Kritis..)
MAX_TOTAL_MB = 3.0              # ambang validasi ukuran total output

TIER_ORDER = [
    "Kritis (DBSCAN + 3 metode)",
    "Sangat Kuat (DBSCAN + metode)",
    "Kuat (3 metode)",
    "Sedang (2 metode)",
    "Lemah (1 metode)",
]
TIER_RANK = {t: i for i, t in enumerate(TIER_ORDER)}
STRONG_TIERS = TIER_ORDER[:3]   # Kritis, Sangat Kuat, Kuat

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
    """Pertahankan tier kuat, sample sisanya sampai total ~SCATTER_SAMPLE."""
    keep_cols = [c for c in feats + ["iso_score", "anomaly_tier",
                                     "is_dbscan_noise", "auto_verdict", "year"]
                 if c in df.columns]
    d = df[keep_cols].dropna(subset=[c for c in feats if c in df.columns], how="all")
    if len(d) <= SCATTER_SAMPLE:
        return d
    hi = d[d["anomaly_tier"].isin(STRONG_TIERS[:2])]      # Kritis + Sangat Kuat: semua
    lo = d.drop(hi.index)
    n_lo = max(0, SCATTER_SAMPLE - len(hi))
    if len(lo) > n_lo:
        lo = lo.sample(n_lo, random_state=42)
    out = pd.concat([hi, lo])
    return out


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
            "nama_profil": ["Prime / Low-Risk", "Moderate-Risk", "Highest-Risk"],
            "n_anggota": [512208, 488402, 347489],
            "default_rate": [0.1165, 0.1919, 0.3337],
            "avg_int_rate": [10.4, 12.9, 17.8],
            "avg_fico": [700, 683, 668],
        })
    return df.to_dict(orient="records")


def process_rules() -> list[dict]:
    if os.path.exists(RULES_CSV):
        df = pd.read_csv(RULES_CSV)
        ren = {}
        if "antecedents" in df.columns:
            ren["antecedents"] = "antecedent"
        if "consequents" in df.columns:
            ren["consequents"] = "consequent"
        df = df.rename(columns=ren)
        if "dataset" not in df.columns:
            df["dataset"] = "Accepted"
        log(f"rules: {len(df)} rule dari CSV")
    else:
        log("rules: Fase 3 belum diekspor -> DUMMY (menyerupai hasil nyata)")
        df = dummy_rules()
    keep = [c for c in ["antecedent", "consequent", "support", "confidence", "lift", "dataset"]
            if c in df.columns]
    return df[keep].to_dict(orient="records")


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

    # --- validasi ukuran total ---
    total_mb = sum(os.path.getsize(os.path.join(OUT_DIR, f))
                   for f in os.listdir(OUT_DIR)) / (1024 * 1024)
    log(f"TOTAL output: {total_mb:.2f} MB (ambang {MAX_TOTAL_MB} MB)")
    if total_mb > MAX_TOTAL_MB:
        log("PERINGATAN: output > ambang. Pertimbangkan agregasi lebih agresif.")
    else:
        log("OK — ukuran dalam anggaran.")


if __name__ == "__main__":
    main()
