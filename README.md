# Route-safety-Analsysis-for-women-and-Solo-Travelers
Women Route Safety App uses district-wise crime data to evaluate risks and provide the safest travel routes. Unsafe areas are flagged, allowing users to avoid high-risk districts. By combining crime analytics with interactive maps, it helps women make informed, real-time decisions for safer commuting and travel.
Here’s a clear and professional **GitHub repository description and README content** for your Women Route Safety project, written for clarity and impact:

---

# Women Route Safety App

**Description:**
The Women Route Safety App is a data-driven web application designed to help users, especially women, travel safely by identifying safe and unsafe routes in real-time. The system analyzes district-wise crime data and dynamically suggests routes to avoid high-risk areas, helping users make informed travel decisions.

**Key Features:**

* Calculates **risk scores for districts** based on crimes against women using NCRB data.
* Provides **real-time route recommendations** from a source to destination.
* Highlights **unsafe areas** and suggests alternative paths.
* Interactive **web-based map visualization** of routes with risk levels.
* User-friendly interface to enter cities by name (no latitude/longitude required).

**How It Works:**

1. The **backend** loads district-wise crime data (`crime_data.csv`) and calculates a risk score for each district.
2. User enters a source and destination in the frontend.
3. The backend geocodes the cities and calculates a driving route using OpenStreetMap’s routing API.
4. Each route segment is mapped to the corresponding district’s risk score.
5. The frontend visualizes the route on a map, highlighting **unsafe districts** and allowing users to see safer alternatives.

**Tech Stack:**

* **Backend:** Python, Flask, Pandas, Requests
* **Frontend:** HTML, CSS, JavaScript, Leaflet.js for map visualization
* **Data:** NCRB (National Crime Records Bureau) district-wise crime data

**Setup Instructions:**

1. Clone the repository.
2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Place your district-wise crime CSV in `backend/data/crime_data.csv`.
4. Run the backend:

   ```bash
   python backend/app.py
   ```
5. Open `frontend/index.html` in your browser.

**Folder Structure:**

```
route-safety-app/
│
├── backend/
│   ├── app.py
│   ├── data/
│   │   └── crime_data.csv
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
└── requirements.txt
```

**Future Improvements:**

* Real-time traffic integration to dynamically adjust safe routes.
* Advanced pathfinding algorithms to automatically avoid unsafe districts.
* Mobile-friendly interface.

**License:** MIT License

---

