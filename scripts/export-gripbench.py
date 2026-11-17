"""Export website replays using GripBench's installed Python environment.

PYTHONPATH=/path/to/GripBench /path/to/GripBench/.venv/bin/python scripts/export-gripbench.py
"""

import json
from pathlib import Path

from gripbench.web import compare

PRESETS = {
    "off-center": ("cube", 0.11, 3),
    "centered-cylinder": ("cylinder", 0.60, 0),
    "low-friction": ("cube", 0.05, 0),
    "centered-cube": ("cube", 0.60, 0),
}


def compact_numbers(value):
    if isinstance(value, float):
        return round(value, 7)
    if isinstance(value, dict):
        return {key: compact_numbers(val) for key, val in value.items()}
    if isinstance(value, (list, tuple)):
        return [compact_numbers(val) for val in value]
    return value


def main():
    destination = Path(__file__).resolve().parents[1] / "assets" / "gripbench"
    destination.mkdir(parents=True, exist_ok=True)
    for key, inputs in PRESETS.items():
        replay = compact_numbers(compare(*inputs))
        (destination / f"{key}.json").write_text(
            json.dumps(replay, separators=(",", ":"), allow_nan=False) + "\n",
            encoding="utf-8",
        )
        print(key, replay["mujoco"], [
            (run["result"]["jaw"], run["result"]["passed"], run["result"]["min_hold_clearance_m"])
            for run in replay["runs"]
        ])


if __name__ == "__main__":
    main()
