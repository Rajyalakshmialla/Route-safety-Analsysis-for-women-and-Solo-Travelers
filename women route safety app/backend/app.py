from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import requests
from pathlib import Path

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

# Load dataset relative to this file so startup does not depend on cwd
BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "data" / "crime_data.csv"
df = pd.read_csv(CSV_PATH)
df.columns = [col.strip().lower() for col in df.columns]

# Build district scores
district_scores = {}
for _, row in df.iterrows():
    district = row["district_name"]
    high = (
        row.get("rape_women_above_18", 0) +
        row.get("rape_girls_below_18", 0) +
        row.get("kidnapping_and_abduction", 0) +
        row.get("human_trafficking", 0)
    )
    medium = (
        row.get("assault_on_womenabove_18", 0) +
        row.get("assault_on_women_below_18", 0) +
        row.get("cruelty_by_husband_or_his_relatives", 0)
    )
    low = row.get("insult_to_the_modesty_of_women_above_18", 0)
    score = (high * 3) + (medium * 2) + low
    district_scores[district] = score

def get_risk(score):
    if score < 500:
        return "safe"
    elif score < 1500:
        return "moderate"
    else:
        return "unsafe"

# Geocode using OpenStreetMap Nominatim
def geocode(place):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": place, "format": "json", "limit": 1}
    res = requests.get(
        url,
        params=params,
        headers={"User-Agent": "women-route-safety-app/1.0"},
        timeout=15,
    )
    res.raise_for_status()
    data = res.json()
    if data:
        return float(data[0]["lat"]), float(data[0]["lon"])
    return None, None

# OSRM route
def get_route_coords(src_lat, src_lon, dest_lat, dest_lon):
    url = f"http://router.project-osrm.org/route/v1/driving/{src_lon},{src_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"
    res = requests.get(url, timeout=15)
    res.raise_for_status()
    data = res.json()
    if "routes" in data and len(data["routes"]) > 0:
        return data["routes"][0]["geometry"]["coordinates"]
    return []

# Simple mapping of coordinate to district (for demo)
def get_district_for_coord(lat, lon):
    # WARNING: This is a placeholder
    # In real system, use proper GIS mapping to districts
    district_list = list(district_scores.keys())
    return district_list[int(abs(lat*10)) % len(district_list)]

@app.route("/route", methods=["GET"])
def route():
    src = request.args.get("src")
    dest = request.args.get("dest")
    if not src or not dest:
        return jsonify({"error": "Please provide both source and destination"}), 400

    try:
        src_lat, src_lon = geocode(src)
        dest_lat, dest_lon = geocode(dest)
    except requests.RequestException as exc:
        return jsonify({"error": f"Geocoding failed: {exc}"}), 502

    if None in (src_lat, src_lon, dest_lat, dest_lon):
        return jsonify({"error": "Could not geocode locations"}), 400

    try:
        coords = get_route_coords(src_lat, src_lon, dest_lat, dest_lon)
    except requests.RequestException as exc:
        return jsonify({"error": f"Route service failed: {exc}"}), 502

    if not coords:
        return jsonify({"error": "Could not get route"}), 500

    # Assign risk per coordinate
    route_segments = []
    for lon, lat in coords:
        district = get_district_for_coord(lat, lon)
        score = district_scores.get(district, 0)
        risk = get_risk(score)
        route_segments.append({
            "lat": lat,
            "lon": lon,
            "risk": risk
        })

    return jsonify(route_segments)

# Serve frontend
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    print(f"Loaded {len(df)} rows from {CSV_PATH}")
    print(f"Calculated scores for {len(district_scores)} districts")
    print("Starting Women Route Safety backend...")
    app.run(debug=True)
