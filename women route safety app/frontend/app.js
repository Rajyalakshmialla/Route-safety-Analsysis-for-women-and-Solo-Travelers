const map = L.map("map").setView([20.5937, 78.9629], 5); // India center

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data © OpenStreetMap contributors"
}).addTo(map);

let routeLayer;

function getRoute() {
  const src = document.getElementById("source").value;
  const dest = document.getElementById("dest").value;
  if (!src || !dest) {
    alert("Please enter both source and destination.");
    return;
  }

  fetch(`/route?src=${src}&dest=${dest}`)
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch route");
      }
      return data;
    })
    .then(data => {
      if (routeLayer) map.removeLayer(routeLayer);
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error("Route data is incomplete.");
      }

      let latlngs = [];
      let colors = [];

      data.forEach(pt => {
        latlngs.push([pt.lat, pt.lon]);
        colors.push(pt.risk);
      });

      // Draw segments
      routeLayer = L.layerGroup();
      for (let i = 0; i < latlngs.length - 1; i++) {
        let color = colors[i] === "safe" ? "green" :
                    colors[i] === "moderate" ? "orange" : "red";
        L.polyline([latlngs[i], latlngs[i + 1]], { color: color, weight: 5 }).addTo(routeLayer);
      }
      routeLayer.addTo(map);
      map.fitBounds(latlngs);
    })
    .catch(err => {
      console.error(err);
      alert(err.message);
    });
}

const REPORTS_STORAGE_KEY = "women-route-safety-reports";
const reportForm = document.getElementById("reportForm");
const reportStatus = document.getElementById("reportStatus");
const reportList = document.getElementById("reportList");
const totalReports = document.getElementById("totalReports");
const highSeverityReports = document.getElementById("highSeverityReports");
const latestArea = document.getElementById("latestArea");

function loadReports() {
  const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
  if (!saved) return [];

  try {
    const reports = JSON.parse(saved);
    if (!Array.isArray(reports)) return [];

    const normalizedReports = reports.map((report, index) => ({
      ...report,
      id: report.id ? String(report.id) : `legacy-report-${index}-${Date.now()}`
    }));

    if (normalizedReports.some((report, index) => report.id !== reports[index]?.id)) {
      saveReports(normalizedReports);
    }

    return normalizedReports;
  } catch (error) {
    console.error("Failed to parse reports", error);
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
}

function formatReportTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

function renderReports() {
  const reports = loadReports().sort((a, b) => new Date(b.timeSeen) - new Date(a.timeSeen));
  totalReports.textContent = String(reports.length);
  highSeverityReports.textContent = String(reports.filter(report => report.severity === "high").length);
  latestArea.textContent = reports[0] ? reports[0].area : "No reports yet";

  if (reports.length === 0) {
    reportList.innerHTML = `
      <div class="empty-state">
        No crime reports have been submitted yet. Use the report form below to add the first one.
      </div>
    `;
    return;
  }

  reportList.innerHTML = reports.map(report => `
    <article class="report-item">
      <div class="report-item-header">
        <div>
          <h4>${escapeHtml(report.type)}</h4>
          <div class="report-meta">
            <strong>${escapeHtml(report.area)}</strong> • ${formatReportTime(report.timeSeen)}
          </div>
        </div>
        <span class="severity-badge severity-${escapeHtml(report.severity)}">${escapeHtml(report.severity)}</span>
      </div>
      <p>${escapeHtml(report.description)}</p>
      <button class="button button-secondary report-close-button" data-report-id="${escapeHtml(report.id)}" type="button">
        Close Report
      </button>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function handleReportSubmit(event) {
  event.preventDefault();

  const report = {
    id: String(Date.now()),
    area: document.getElementById("reportArea").value.trim(),
    type: document.getElementById("reportType").value.trim(),
    severity: document.getElementById("reportSeverity").value,
    timeSeen: document.getElementById("reportTime").value,
    description: document.getElementById("reportDescription").value.trim()
  };

  if (!report.area || !report.type || !report.severity || !report.timeSeen || !report.description) {
    reportStatus.textContent = "Please complete all report fields.";
    return;
  }

  const reports = loadReports();
  reports.push(report);
  saveReports(reports);
  reportForm.reset();
  reportStatus.textContent = "Report saved to the dashboard.";
  renderReports();
}

function closeReport(reportId) {
  const reports = loadReports().filter(report => report.id !== reportId);
  saveReports(reports);
  reportStatus.textContent = "Report closed and removed from the dashboard.";
  renderReports();
}

reportForm.addEventListener("submit", handleReportSubmit);
reportList.addEventListener("click", event => {
  const button = event.target.closest(".report-close-button");
  if (!button) return;
  closeReport(button.dataset.reportId);
});
renderReports();
