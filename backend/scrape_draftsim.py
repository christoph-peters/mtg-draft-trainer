import json
import os
import re
import requests
import argparse

def scrape_draftsim_ratings(set_code: str):
    set_code = set_code.upper()
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    metadata_path = os.path.join(backend_dir, "..", "frontend", "public", "data", f"{set_code.lower()}_metadata.json")
    stats_path = os.path.join(backend_dir, "..", "frontend", "public", "data", f"{set_code.lower()}_stats.json")

    if not os.path.exists(metadata_path):
        print(f"Error: metadata file not found at {metadata_path}. Fetch set metadata first.")
        return

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    print(f"Loaded {len(metadata)} cards from metadata.")

    url = f"https://draftsim.com/mtg-{set_code.lower()}-limited-set-review/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    print(f"Fetching Draftsim review from {url}...")
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Error fetching page: HTTP {response.status_code}")
        return

    html_content = response.text
    print(f"Downloaded {len(html_content)} bytes of HTML.")

    # We will search for card names in the HTML and locate their ratings
    master_stats = {}
    matched_count = 0

    # Rating regex looking for patterns like "Rating: 7/10" or "Rating: 4.5/10" or "Rating: 8"
    rating_re = re.compile(r"Rating:\s*(?:<strong>)?(\d+(?:\.\d+)?)(?:\s*/\s*10)?", re.IGNORECASE)

    for card_name in metadata:
        # Some double-faced cards might be named "A // B" in metadata but just "A" in Draftsim headings
        search_names = [card_name]
        if " // " in card_name:
            search_names.append(card_name.split(" // ")[0])

        found_idx = -1
        found_name = ""
        for s_name in search_names:
            idx = html_content.find(s_name)
            if idx != -1:
                found_idx = idx
                found_name = s_name
                break

        if found_idx == -1:
            continue

        # Look in the next 1500 characters for the rating
        snippet = html_content[found_idx:found_idx + 1500]
        match = rating_re.search(snippet)
        if match:
            rating_val = float(match.group(1))
            
            # Map Draftsim 0-10 rating to estimated 17lands statistics:
            # 1. average pick (avg_pick): 10/10 -> pick 1.0 (best), 0/10 -> pick 15.0 (worst)
            # Formula: avg_pick = 15.0 - (rating * 1.4)
            avg_pick = max(1.0, min(15.0, round(15.0 - (rating_val * 1.4), 2)))

            # 2. win rate (wr): 10/10 -> 65% winrate, 0/10 -> 45% winrate
            # Formula: wr = 0.45 + (rating * 0.02)
            win_rate = max(0.40, min(0.70, round(0.45 + (rating_val * 0.02), 4)))

            # Save in the same structure as 17Lands stats so frontend loads it seamlessly
            master_stats[card_name] = {
                "Overall": {
                    "pick": avg_pick,
                    "wr": win_rate
                }
            }
            matched_count += 1
            print(f"✔ Matched: {card_name} -> Rating: {rating_val} (Pick: {avg_pick}, WR: {win_rate:.2%})")

    print(f"\nDone! Scraped and generated stats for {matched_count}/{len(metadata)} cards.")

    # Write stats to file
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(master_stats, f, indent=2)
    print(f"Saved ratings to {stats_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Draftsim set ratings to generate simulated 17Lands stats.")
    parser.add_argument("set_code", type=str, help="The 3-letter MTG set code (e.g. MSH, SPM)")
    args = parser.parse_args()
    
    scrape_draftsim_ratings(args.set_code)
