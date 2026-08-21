"""
add_new_set.py — Add a new MTG set to the Draft Trainer.

Usage:
    python3 backend/add_new_set.py MSH
    python3 backend/add_new_set.py MSH --name "Marvel Super Heroes (2026)"
    python3 backend/add_new_set.py MSH --skip-fetch  # only update config files
"""
import requests
import json
import argparse
import os
import re
import sys

# Allow importing fetch_set_data from the same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_set_data import fetch_set_data


ROOT_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UTILS_PATH    = os.path.join(ROOT_DIR, "frontend", "src", "utils.js")
WORKFLOW_PATH = os.path.join(ROOT_DIR, ".github", "workflows", "update_data.yml")
DATA_DIR      = os.path.join(ROOT_DIR, "frontend", "public", "data")


def get_set_info(set_code: str) -> dict:
    """Query Scryfall for set metadata."""
    url = f"https://api.scryfall.com/sets/{set_code.lower()}"
    headers = {"User-Agent": "MTGDraftTrainer/1.0"}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"✗ Set '{set_code}' not found on Scryfall (HTTP {response.status_code})")
        sys.exit(1)
    data = response.json()
    return {
        "code": data["code"].upper(),
        "name": data["name"],
        "released_at": data.get("released_at", ""),
        "set_type": data.get("set_type", ""),
    }


def update_utils_js(set_code: str, display_name: str) -> bool:
    """Prepend new set to the SETS array at the top of utils.js."""
    with open(UTILS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if f"id: '{set_code}'" in content:
        print(f"  '{set_code}' already present in utils.js — skipping.")
        return False

    new_entry = f"  {{ id: '{set_code}', name: '{display_name}' }},\n"
    updated = content.replace(
        "export const SETS = [\n",
        f"export const SETS = [\n{new_entry}",
    )

    if updated == content:
        print("  ⚠ Could not locate SETS array in utils.js — please add manually.")
        return False

    with open(UTILS_PATH, "w", encoding="utf-8") as f:
        f.write(updated)

    print(f"  ✓ Prepended '{set_code}' to SETS array in utils.js")
    return True


def update_workflow_active_sets(set_code: str) -> None:
    """Keep the active-sets default list in update_data.yml up to date (max 6 sets)."""
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'(echo "sets=)([A-Z0-9 ]+)(" >> \$GITHUB_OUTPUT)'
    match = re.search(pattern, content)
    if not match:
        print("  ⚠ Could not locate sets list in update_data.yml — please update manually.")
        return

    current = match.group(2).split()
    if set_code in current:
        print(f"  '{set_code}' already in active sets list — skipping.")
        return

    # Prepend new set; keep list to ≤6 entries to avoid excessively long runs
    new_sets = ([set_code] + current)[:6]
    replacement = match.group(1) + " ".join(new_sets) + match.group(3)
    content = re.sub(pattern, replacement, content)

    with open(WORKFLOW_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"  ✓ Updated active sets → {' '.join(new_sets)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Add a new MTG set to the Draft Trainer (fetches data + updates config)."
    )
    parser.add_argument("set_code", type=str, help="3-letter MTG set code, e.g. MSH")
    parser.add_argument(
        "--name",
        type=str,
        default="",
        help="Override display name shown in the UI (default: Scryfall name).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=3.0,
        help="Seconds between 17Lands API requests (default: 3).",
    )
    parser.add_argument(
        "--skip-fetch",
        action="store_true",
        help="Skip fetching card data — only update utils.js and the workflow file.",
    )
    args = parser.parse_args()

    set_code = args.set_code.upper()

    print(f"\n{'═' * 50}")
    print(f"  Adding set: {set_code}")
    print(f"{'═' * 50}\n")

    # 1. Resolve display name
    set_info = get_set_info(set_code)
    display_name = args.name.strip() or set_info["name"]
    print(f"  Scryfall name : {set_info['name']}")
    print(f"  Display name  : {display_name}")
    print(f"  Released      : {set_info['released_at']}")
    print(f"  Type          : {set_info['set_type']}")

    # 2. Fetch card data (Scryfall + 17Lands)
    if not args.skip_fetch:
        print(f"\n--- Fetching card data ---")
        fetch_set_data(set_code, delay=args.delay)
    else:
        print("\n  (Skipping card data fetch)")

    # 3. Update utils.js
    print(f"\n--- Updating frontend/src/utils.js ---")
    update_utils_js(set_code, display_name)

    # 4. Update workflow active-sets list
    print(f"\n--- Updating .github/workflows/update_data.yml ---")
    update_workflow_active_sets(set_code)

    print(f"\n{'═' * 50}")
    print(f"  ✅  {set_code} ({display_name}) ready!")
    print(f"{'═' * 50}")
    print("\nNext steps:")
    print("  1. Review utils.js — adjust display name / year suffix if needed")
    print("  2. Check the generated JSON files in frontend/public/data/")
    print("  3. Commit & push → deploy workflow will publish the site\n")
