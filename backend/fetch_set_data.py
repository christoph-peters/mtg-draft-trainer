import requests
import json
import argparse
import os
import time

BASIC_LANDS = {"Plains", "Island", "Swamp", "Mountain", "Forest", "Snow-Covered Plains", "Snow-Covered Island", "Snow-Covered Swamp", "Snow-Covered Mountain", "Snow-Covered Forest", "Wastes"}
ARCHETYPES = ["Overall", "WU", "UB", "BR", "RG", "WG", "WB", "UR", "BG", "WR", "UG"]

def get_scryfall_data(set_code: str):
    print(f"Fetching Scryfall metadata for set: {set_code}...")
    metadata = {}
    url = f"https://api.scryfall.com/cards/search?q=set%3A{set_code}"
    headers = {"User-Agent": "MTGDraftTrainer/1.0"}
    
    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Error fetching Scryfall data: {response.status_code}")
            try:
                print(response.json())
            except Exception:
                print(response.text[:200])
            break
            
        data = response.json()
        for card in data.get("data", []):
            name = card.get("name")
            # Filter out tokens and basic lands
            if card.get("layout") in ["token", "emblem", "art_series"] or name in BASIC_LANDS:
                continue
                
            usd = card.get("prices", {}).get("usd")
            eur = card.get("prices", {}).get("eur")
            
            # Handle double-faced cards for images
            image_url = ""
            if "image_uris" in card:
                image_url = card["image_uris"].get("large", card["image_uris"].get("normal"))
            elif "card_faces" in card:
                image_url = card["card_faces"][0].get("image_uris", {}).get("large")

            if name and image_url:
                metadata[name] = {
                    "name": name,
                    "color": "".join(card.get("colors", [])),
                    "rarity": card.get("rarity", ""),
                    "image_url": image_url,
                    "price": float(usd) if usd else 0.0,
                    "price_eur": float(eur) if eur else 0.0
                }
        
        url = data.get("next_page")
        if url:
            time.sleep(0.1)
            
    return metadata

def fetch_set_data(set_code: str, delay: float = 3.0):
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "public", "data")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Get Master Metadata
    master_metadata = get_scryfall_data(set_code)
    
    # 2. Get 17Lands Stats for each archetype
    master_stats = {}
    headers = {"User-Agent": "MTGDraftTrainer/1.0"}
    errors = 0
    
    print(f"Fetching 17Lands stats for set: {set_code} (delay={delay}s between requests)...")
    
    for i, archetype in enumerate(ARCHETYPES):
        if i > 0:
            time.sleep(delay)  # Throttle requests
        
        print(f"  Processing {archetype}...")
        color_param = "" if archetype == "Overall" else f"&colors={archetype}"
        url = f"https://www.17lands.com/card_ratings/data?expansion={set_code.upper()}&format=PremierDraft&start_date=2020-01-01&end_date=2030-01-01{color_param}"
        
        # Retry once on failure
        for attempt in range(2):
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                break
            if attempt == 0:
                print(f"    Retrying in {delay * 2}s...")
                time.sleep(delay * 2)
        
        if response.status_code != 200:
            print(f"    Error fetching {archetype}: HTTP {response.status_code}")
            errors += 1
            continue
            
        data = response.json()
        for card in data:
            name = card.get("name")
            if name not in master_metadata:
                continue
                
            avg_pick = card.get("avg_pick")
            if avg_pick is None or avg_pick == 0:
                continue
            
            # Filter low game counts for specific archetypes
            if archetype != "Overall" and card.get("game_count", 0) < 50:
                continue

            if name not in master_stats:
                master_stats[name] = {}
            
            master_stats[name][archetype] = {
                "pick": round(avg_pick, 2),
                "wr": round(card.get("win_rate", 0), 4) if card.get("win_rate") else None
            }

    # 3. Save Files
    # Always save metadata (Scryfall doesn't rate-limit)
    with open(os.path.join(output_dir, f"{set_code.lower()}_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(master_metadata, f, indent=2)
    
    # Only save stats if we actually got data (prevents wiping good data on 403s)
    stats_path = os.path.join(output_dir, f"{set_code.lower()}_stats.json")
    if len(master_stats) > 0:
        with open(stats_path, "w", encoding="utf-8") as f:
            json.dump(master_stats, f, indent=2)
        print(f"✓ {set_code}: Saved {len(master_stats)} cards with stats ({errors} archetype errors)")
    else:
        if not os.path.exists(stats_path) or os.path.getsize(stats_path) <= 2:
            with open(stats_path, "w", encoding="utf-8") as f:
                json.dump({}, f, indent=2)
            print(f"⚠ {set_code}: Got 0 stats, but created empty stats file so frontend doesn't crash.")
        else:
            print(f"✗ {set_code}: Got 0 stats (all {errors} requests failed). Existing stats file NOT overwritten.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch MTG set data (Master/Stats format).")
    parser.add_argument("set_code", type=str, help="The 3-letter MTG set code (e.g. MH3)")
    parser.add_argument("--delay", type=float, default=3.0, help="Delay in seconds between 17Lands requests (default: 3)")
    args = parser.parse_args()
    
    fetch_set_data(args.set_code, delay=args.delay)

