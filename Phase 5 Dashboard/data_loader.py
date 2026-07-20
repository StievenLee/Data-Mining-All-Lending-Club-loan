"""
data_loader.py — Lapisan pemuatan & agregasi data untuk dashboard Fase 5.

Prinsip desain:
- File asli Fase 1-4 TIDAK diubah. Modul ini hanya membaca lalu mengagregasi.
- File rejected sangat besar (~27 juta baris). Untuk dashboard, rejected difilter ke
  tier kuat ke atas + sampling agar ringan di browser & server.
- Bila CSV hasil Fase 2/3/4 belum disambungkan, fungsi otomatis memakai data DUMMY
  berskema sama (SELARAS dengan output asli notebook), sehingga app bisa langsung
  dijalankan untuk melihat tampilannya. Angka dummy dipilih agar dekat dengan hasil
  eksekusi nyata (mis. default rate klaster, distribusi tier, metrik rules).
- File JSON DBSCAN Fase 2 (dbscan_outliers_*.json) NYATA dan langsung dibaca untuk KPI.

Cara menyambungkan data asli:
- Salin CSV hasil Fase 2/3/4 ke folder ./data (lihat path di bawah), lalu jalankan ulang.
  Bila file ditemukan, dummy otomatis dimatikan.
"""
from __future__ import annotations
import os
import re
import json
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
BASE_DIR = os.path.dirname(__file__)

ANOMALY_ACCEPTED_PATH = os.path.join(DATA_DIR, "anomaly_report_accepted.csv")
ANOMALY_REJECTED_PATH = os.path.join(DATA_DIR, "anomaly_report_rejected.csv")
INVESTIGATION_PATH    = os.path.join(DATA_DIR, "investigation_table_accepted.csv")
RULES_ACCEPTED_PATH   = os.path.join(DATA_DIR, "results_apriori_accepted.csv")  # Fase 3
RULES_REJECTED_PATH   = os.path.join(DATA_DIR, "results_apriori_rejected.csv")  # Fase 3
CLUSTER_PATH          = os.path.join(DATA_DIR, "cluster_profiles.csv")          # Fase 2

# JSON DBSCAN nyata dari Fase 2 (disertakan di repo dashboard)
DBSCAN_ACC_JSON = os.path.join(BASE_DIR, "dbscan_outliers_accepted.json")
DBSCAN_REJ_JSON = os.path.join(BASE_DIR, "dbscan_outliers_rejected.json")

REJECTED_MIN_TIER_RANK = 2     # 0=Kritis ... hanya muat tier <= rank ini utk rejected

TIER_ORDER = [
    "Kritis (DBSCAN + 3 metode)",
    "Sangat Kuat (DBSCAN + metode)",
    "Kuat (3 metode)",
    "Sedang (2 metode)",
    "Lemah (1 metode)",
]
TIER_RANK = {t: i for i, t in enumerate(TIER_ORDER)}


# ---------------------------------------------------------------------------
# DBSCAN JSON nyata (Fase 2) — dipakai untuk KPI & anotasi
# ---------------------------------------------------------------------------
def load_dbscan_meta(dataset: str) -> dict:
    path = DBSCAN_ACC_JSON if dataset == "accepted" else DBSCAN_REJ_JSON
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {"n_noise": 0, "pct_noise": 0.0, "eps": 0.0,
                "sample_size": 0, "noise_global_index": []}


# ---------------------------------------------------------------------------
# Data dummy — berskema sama dg output Fase 4, angka dekat ke hasil nyata.
# ---------------------------------------------------------------------------
def _dummy_anomaly(n=4000, seed=0, dbscan_noise=59):
    rng = np.random.default_rng(seed)
    feats = ["int_rate", "fico_range_low", "installment",
             "acc_open_past_24mths", "num_tl_op_past_12m"]
    df = pd.DataFrame({f: rng.normal(0, 1, n) for f in feats})
    # anomali cenderung punya bunga tinggi & FICO rendah -> geser sebagian
    hi = rng.random(n) < 0.35
    df.loc[hi, "int_rate"] += rng.uniform(1.5, 4.0, hi.sum())
    df.loc[hi, "fico_range_low"] -= rng.uniform(0.5, 2.5, hi.sum())
    df["iso_score"] = rng.uniform(0.45, 0.82, n)
    df["n_methods_flag"] = rng.choice([1, 2, 3], n, p=[0.60, 0.27, 0.13])
    df["is_dbscan_noise"] = False
    df.loc[rng.choice(n, min(dbscan_noise, n), replace=False), "is_dbscan_noise"] = True
    tier = np.array(["Lemah (1 metode)"] * n, dtype=object)
    tier[df["n_methods_flag"] == 2] = "Sedang (2 metode)"
    tier[df["n_methods_flag"] == 3] = "Kuat (3 metode)"
    tier[df["is_dbscan_noise"] & (df["n_methods_flag"] >= 1)] = "Sangat Kuat (DBSCAN + metode)"
    tier[df["is_dbscan_noise"] & (df["n_methods_flag"] == 3)] = "Kritis (DBSCAN + 3 metode)"
    df["anomaly_tier"] = tier
    df["auto_verdict"] = rng.choice(
        ["Kasus Langka (Sah)", "Sinyal Risiko", "Kesalahan Data"],
        n, p=[0.775, 0.222, 0.003])
    return df


def _dummy_rules(seed=1):
    # 14 rule pilihan menyerupai hasil Fase 3 (10 accepted + 4 rejected).
    rows = [
        ("dti Low + bunga Very Low + term 36", "grade A + Fully Paid", 0.067, 0.946, 5.771),
        ("income Mid + bunga Very Low",        "grade A + Fully Paid", 0.057, 0.943, 5.758),
        ("bunga Very Low + Fully Paid",        "grade A + term 36",    0.142, 0.977, 5.754),
        ("bunga Very Low + loan Medium",       "grade A + Fully Paid", 0.054, 0.943, 5.754),
        ("bunga High + term 36",               "grade D",              0.075, 0.765, 5.111),
        ("home RENT + bunga High",             "grade D",              0.052, 0.718, 4.797),
        ("bunga High + Fully Paid",            "grade D",              0.083, 0.716, 4.784),
        ("income Mid + bunga Low",             "grade B + MORTGAGE",   0.052, 0.503, 3.454),
        ("bunga Low + loan Small + Fully Paid", "grade B + term 36",   0.071, 0.879, 3.434),
        ("bunga Low + loan Small",             "grade B + term 36",    0.081, 0.879, 3.432),
        ("DTI Very Low + kerja Junior",        "Amount Small (<5K)",   0.117, 0.481, 1.331),
        ("DTI Very Low",                       "Amount Small (<5K)",   0.137, 0.479, 1.324),
        ("DTI Very High",                      "Amount Large",         0.080, 0.370, 1.317),
        ("DTI Very High + kerja Junior",       "Amount Large",         0.074, 0.367, 1.309),
    ]
    df = pd.DataFrame(rows, columns=["antecedent", "consequent",
                                     "support", "confidence", "lift"])
    df["dataset"] = ["Accepted"] * 10 + ["Rejected"] * 4
    return df.sort_values("lift", ascending=False).reset_index(drop=True)


def _dummy_clusters(seed=2):
    # Profil klaster accepted (K=3) sesuai hasil Fase 2 (default rate 11.7/19.2/33.4%).
    return pd.DataFrame({
        "cluster": [0, 1, 2],
        "nama_profil": ["Prime / Low-Risk", "Moderate-Risk", "Highest-Risk"],
        "n_anggota": [512208, 488402, 347489],
        "default_rate": [0.1165, 0.1919, 0.3337],
        "avg_int_rate": [10.4, 12.9, 17.8],
        "avg_fico": [700, 683, 668],
    })


# ---------------------------------------------------------------------------
# Pemuat publik
# ---------------------------------------------------------------------------
def _read_or_dummy(path, dummy_fn, label):
    if os.path.exists(path):
        try:
            df = pd.read_csv(path)
            print(f"[data_loader] {label}: dimuat dari {path} ({len(df):,} baris)")
            return df, False
        except Exception as e:  # noqa
            print(f"[data_loader] {label}: gagal baca ({e}); memakai dummy.")
    else:
        print(f"[data_loader] {label}: file tidak ada; memakai DUMMY.")
    return dummy_fn(), True


def load_anomaly(dataset: str) -> pd.DataFrame:
    """dataset = 'accepted' | 'rejected'. Rejected difilter+sampling agar ringan."""
    meta = load_dbscan_meta(dataset)
    n_noise = int(meta.get("n_noise", 59))
    if dataset == "accepted":
        df, is_dummy = _read_or_dummy(
            ANOMALY_ACCEPTED_PATH,
            lambda: _dummy_anomaly(4000, seed=0, dbscan_noise=n_noise),
            "anomaly accepted")
    else:
        df, is_dummy = _read_or_dummy(
            ANOMALY_REJECTED_PATH,
            lambda: _dummy_anomaly(3000, seed=5, dbscan_noise=n_noise),
            "anomaly rejected")
        if not is_dummy and "anomaly_tier" in df.columns:
            df = df[df["anomaly_tier"].map(TIER_RANK).fillna(99) <= REJECTED_MIN_TIER_RANK]
            print(f"[data_loader] rejected difilter ke tier>=Kuat -> {len(df):,} baris")
    return df


def scatter_frame(df: pd.DataFrame, x: str, y: str) -> pd.DataFrame:
    # Tanpa sampling: seluruh titik terfilter digambar agar kepadatan scatter
    # benar-benar mencerminkan filter tahun. Scattergl (WebGL) menanggung volume.
    keep = [c for c in [x, y, "iso_score", "anomaly_tier", "is_dbscan_noise",
                        "is_contextual_outlier", "is_collective_outlier",
                        "auto_verdict"] if c in df.columns]
    return df[keep].dropna(subset=[x, y])


def tier_counts(df: pd.DataFrame) -> pd.DataFrame:
    vc = (df["anomaly_tier"].value_counts()
          .reindex(TIER_ORDER).fillna(0).astype(int).reset_index())
    vc.columns = ["tier", "jumlah"]
    return vc


def verdict_counts(df: pd.DataFrame) -> pd.DataFrame:
    if "auto_verdict" not in df.columns:
        return pd.DataFrame({"verdict": [], "jumlah": []})
    vc = df["auto_verdict"].value_counts().reset_index()
    vc.columns = ["verdict", "jumlah"]
    return vc


# ---------------------------------------------------------------------------
# Dimensi waktu (Fase 5) — filter per tahun
# ---------------------------------------------------------------------------
def year_bounds(*frames: pd.DataFrame) -> tuple[int, int] | None:
    """Rentang tahun yang tersedia lintas dataset. None bila kolom 'year' tak ada."""
    vals = []
    for df in frames:
        if df is not None and "year" in df.columns:
            s = pd.to_numeric(df["year"], errors="coerce").dropna()
            if len(s):
                vals.append((int(s.min()), int(s.max())))
    if not vals:
        return None
    return min(v[0] for v in vals), max(v[1] for v in vals)


def filter_years(df: pd.DataFrame, yr: tuple[int, int] | None) -> pd.DataFrame:
    """Saring baris ke rentang [lo, hi]. Tanpa kolom 'year' atau yr=None -> apa adanya."""
    if yr is None or "year" not in df.columns:
        return df
    lo, hi = yr
    s = pd.to_numeric(df["year"], errors="coerce")
    return df[s.between(lo, hi)]


def _clean_itemset(s) -> str:
    """Ubah itemset apriori jadi label ringkas 'a + b + c'.
    Menangani format frozenset({'x', 'y'}) (mlxtend/mlextend) maupun 'x, y' biasa."""
    s = str(s).strip()
    m = re.match(r"^frozenset\(\{(.*)\}\)$", s, re.S)
    if m:
        s = m.group(1)
    s = s.replace("'", "").replace('"', "")
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return " + ".join(parts)


def load_rules(dataset: str = "accepted") -> pd.DataFrame:
    """Association rules Fase 3 per dataset ('accepted' | 'rejected').
    File: results_apriori_accepted.csv / results_apriori_rejected.csv."""
    path = RULES_ACCEPTED_PATH if dataset == "accepted" else RULES_REJECTED_PATH
    df, is_dummy = _read_or_dummy(
        path,
        lambda: _dummy_rules()[lambda d: d["dataset"].str.lower() == dataset],
        f"association rules {dataset}")
    # Normalisasi nama kolom bila CSV asli Fase 3 dipakai (antecedents/consequents).
    if not is_dummy:
        ren = {}
        if "antecedents" in df.columns: ren["antecedents"] = "antecedent"
        if "consequents" in df.columns: ren["consequents"] = "consequent"
        df = df.rename(columns=ren)
        for col in ["antecedent", "consequent"]:
            if col in df.columns:
                df[col] = df[col].map(_clean_itemset)
        for col in ["support", "confidence", "lift"]:
            if col not in df.columns:
                df[col] = np.nan
        df["dataset"] = dataset.capitalize()
    df = df.sort_values("lift", ascending=False).reset_index(drop=True)
    return df


def load_clusters() -> pd.DataFrame:
    df, _ = _read_or_dummy(CLUSTER_PATH, _dummy_clusters, "cluster profiles")
    return df


def kpi_summary(acc: pd.DataFrame, rej: pd.DataFrame, rules: pd.DataFrame) -> dict:
    def crit(df):
        return int((df["anomaly_tier"] == "Kritis (DBSCAN + 3 metode)").sum()) \
            if "anomaly_tier" in df.columns else 0
    meta_acc = load_dbscan_meta("accepted")
    return {
        "total_anomali_acc": len(acc),
        "kritis_acc": crit(acc),
        "kritis_rej": crit(rej),
        "n_rules": len(rules),
        "max_lift": float(rules["lift"].max()) if "lift" in rules.columns and len(rules) else 0.0,
        "dbscan_noise_acc": int(meta_acc.get("n_noise", 0)),
    }
