
import pandas as pd
from pathlib import Path

df = pd.read_csv("deliveries.csv")

# Identify extras that do not count as legal balls.
extras = df["extras_type"].fillna("").astype(str).str.lower()
illegal_deliveries = extras.isin(["wides", "noballs", "no-balls"])

df["legal_ball"] = (~illegal_deliveries).astype(int)

# Runs charged to the bowler: exclude byes and leg-byes.
uncharged_extras = extras.isin(["byes", "legbyes", "leg-byes", "penalty"])
df["bowler_runs"] = df["total_runs"] - df["extra_runs"].where(
    uncharged_extras, 0
)

# Wickets credited to the bowler.
non_bowler_dismissals = {
    "run out", "retired hurt", "retired out",
    "obstructing the field"
}
dismissals = df["dismissal_kind"].fillna("").str.lower()

df["bowler_wicket"] = (
    (df["is_wicket"] == 1)
    & (~dismissals.isin(non_bowler_dismissals))
).astype(int)

stats = df.groupby("bowler").agg(
    recorded_deliveries=("bowler", "size"),
    legal_balls=("legal_ball", "sum"),
    runs_conceded=("bowler_runs", "sum"),
    wickets=("bowler_wicket", "sum")
)

stats["overs"] = stats["legal_balls"] / 6
stats["economy"] = (
    stats["runs_conceded"] / stats["overs"].replace(0, float("nan"))
).round(2)
stats["bowling_average"] = (
    stats["runs_conceded"] / stats["wickets"].replace(0, float("nan"))
).round(2)

stats = stats.sort_values("recorded_deliveries", ascending=False)

Path("reports").mkdir(exist_ok=True)
stats.to_csv("reports/player_bowling_statistics_check.csv")

print("\nVirat Kohli's bowling statistics:")
print(stats.loc[stats.index.str.contains("Kohli", case=False)].to_string())

print("\nTop 20 bowlers:")
print(stats.head(20).to_string())

print("\nSaved all players to reports/player_bowling_statistics_check.csv")
