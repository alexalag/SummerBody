import pandas as pd
import json
from collections import defaultdict

# ── Load ──────────────────────────────────────────────────────────────────────
df = pd.read_csv("data.csv", sep=";")

# ── Clean ─────────────────────────────────────────────────────────────────────
df["DOB"]  = pd.to_datetime(df["DOB"],  errors="coerce")
df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
df["Sex"]  = df["Sex"].str.strip().str.lower()
df["Event"] = df["Event"].str.strip()

# Drop rows with missing dates
df = df.dropna(subset=["DOB", "Date"])

# ── Compute age at time of performance ───────────────────────────────────────
def age_at(dob, date):
    age = date.year - dob.year
    if (date.month, date.day) < (dob.month, dob.day):
        age -= 1
    return age

df["age"] = df.apply(lambda r: age_at(r["DOB"], r["Date"]), axis=1)

# Sanity filter — remove implausible ages
df = df[(df["age"] >= 10) & (df["age"] <= 80)]

# ── Build histogram bins per event ───────────────────────────────────────────
output = {}

for event, group in df.groupby("Event"):
    event_data = {}

    for sex in ["male", "female", "all"]:
        subset = group if sex == "all" else group[group["Sex"] == sex]
        if subset.empty:
            continue

        ages = subset["age"].tolist()
        min_age, max_age = int(min(ages)), int(max(ages))

        # 1-year bins
        bins = {age: 0 for age in range(min_age, max_age + 1)}
        for a in ages:
            bins[int(a)] += 1

        event_data[sex] = {
            "bins":   [{"age": k, "count": v} for k, v in sorted(bins.items())],
            "stats": {
                "count":  len(ages),
                "min":    min_age,
                "max":    max_age,
                "mean":   round(sum(ages) / len(ages), 1),
                "median": int(sorted(ages)[len(ages) // 2]),
            }
        }

    output[event] = event_data

# ── Write JSON ────────────────────────────────────────────────────────────────
with open("age_distribution.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"✓ {len(df)} valid performances across {len(output)} events")
print(f"✓ Saved to age_distribution.json\n")
print(f"{'Event':<35} {'All':>5} {'Male':>6} {'Female':>8}  Median age")
print("-" * 70)
for event, data in sorted(output.items()):
    counts = {s: data[s]["stats"]["count"] for s in data}
    median = data.get("all", data.get("male", data.get("female")))["stats"]["median"]
    print(
        f"{event:<35}"
        f"{counts.get('all',   0):>5}"
        f"{counts.get('male',  0):>7}"
        f"{counts.get('female',0):>8}"
        f"  {median}"
    )
