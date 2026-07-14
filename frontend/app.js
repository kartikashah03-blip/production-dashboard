// =====================================
// Global Variables
// =====================================
const API_URL =
    "https://production-dashboard-api.onrender.com";


let allData = [];

let barChart;
let pieChart;
let doughnutChart;
let lineChart;

// =====================================
// Initial Load
// =====================================

async function loadAll() {
    try {
        await loadAnalytics();

        allData = await fetchAlerts();

        populateDropdowns(allData);

        updateHighRiskCount(allData);

        renderTable(allData);

        renderCharts(allData);

    } catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );
    }
}

// =====================================
// Fetch Alerts
// =====================================

async function fetchAlerts() {

    const response =
        await fetch(
            "fetch(`${API_URL}/alerts`)"
        );

    return await response.json();
}

// =====================================
// Analytics
// =====================================

async function loadAnalytics() {

    const response =
        await fetch(
            "fetch(`${API_URL}/analytics`)"
        );

    const analytics =
        await response.json();

    document.getElementById("total").innerText =
        analytics.total_records;

    document.getElementById("avg").innerText =
        analytics.avg_adherence;

    document.getElementById("shortage").innerText =
        analytics.total_shortage;

    document.getElementById("highRisk").innerText =
        analytics.high_risk;
}

// =====================================
// Populate Filters
// =====================================

function populateDropdowns(data) {

    populateSelect(
        "oem",
        [...new Set(data.map(x => x.oem))]
    );

    populateSelect(
        "plant",
        [...new Set(data.map(x => x.plant))]
    );

    populateSelect(
        "risk",
        [...new Set(data.map(x => x.risk_flag))]
    );
}

function populateSelect(id, values) {

    const select =
        document.getElementById(id);

    values.forEach(value => {

        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = value;

        select.appendChild(option);
    });
}

// =====================================
// High Risk KPI
// =====================================

function updateHighRiskCount(data) {

    const count = data.filter(
        x => x.risk_flag === "HIGH"
    ).length;

    document.getElementById(
        "highRisk"
    ).innerText = count;
}

// =====================================
// Apply Filters
// =====================================

function applyFilters() {

    const oem =
        document.getElementById("oem").value;

    const plant =
        document.getElementById("plant").value;

    const risk =
        document.getElementById("risk").value;

    const filtered =
        allData.filter(item => {

            return (
                (!oem || item.oem === oem) &&
                (!plant || item.plant === plant) &&
                (!risk || item.risk_flag === risk)
            );

        });

    // ✅ Add this block HERE

    if (filtered.length === 0) {

        document.getElementById("table").innerHTML = `
            <tr>
                <td colspan="9">
                    No records found for selected filters
                </td>
            </tr>
        `;

        updateHighRiskCount([]);

        destroyCharts();

        return;
    }

    // ✅ Existing code

    renderTable(filtered);

    renderCharts(filtered);

    updateHighRiskCount(filtered);
}

// =====================================
// Clear Filters
// =====================================

function clearFilters() {

    document.getElementById("oem").value = "";
    document.getElementById("plant").value = "";
    document.getElementById("risk").value = "";

    renderTable(allData);

    renderCharts(allData);

    updateHighRiskCount(allData);
}

// =====================================
// Render Table
// =====================================

function renderTable(data) {

    let html = `
        <tr>
            <th>Product</th>
            <th>OEM</th>
            <th>Supplier</th>
            <th>Plant</th>
            <th>Requested Qty</th>
            <th>Supplied Qty</th>
            <th>Shortage Qty</th>
            <th>Adherence %</th>
            <th>Risk</th>
        </tr>
    `;

    data.forEach(item => {

        const rowClass =
            item.risk_flag === "HIGH"
            ? "high-risk"
            : "";

        html += `
            <tr class="${rowClass}">
                <td>${item.product}</td>
                <td>${item.oem}</td>
                <td>${item.supplier_name}</td>
                <td>${item.plant}</td>
                <td>${item.requested_qty}</td>
                <td>${item.supplied_qty}</td>
                <td>${item.shortage_qty}</td>
                <td>${item.adherence}</td>
                <td>${item.risk_flag}</td>
            </tr>
        `;
    });

    document.getElementById(
        "table"
    ).innerHTML = html;
}

// =====================================
// Charts
// =====================================

function renderCharts(data) {

    destroyCharts();

    createBarChart(data);
    createPieChart(data);
    createDoughnutChart(data);
    createLineChart(data);
}

function destroyCharts() {

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
    if (doughnutChart) doughnutChart.destroy();
    if (lineChart) lineChart.destroy();
}

// =====================================
// BAR CHART
// =====================================

function createBarChart(data) {

    barChart =
        new Chart(
            document.getElementById(
                "barChart"
            ),
            {
                type: "bar",

                data: {
                    labels:
                        data.map(
                            x => x.product
                        ),

                    datasets: [{
                        label:
                            "Adherence %",

                        data:
                            data.map(
                                x => x.adherence
                            ),

                        backgroundColor:
                            "#2563eb"
                    }]
                }
            }
        );
}

// =====================================
// PIE CHART
// =====================================

function createPieChart(data) {

    const high =
        data.filter(
            x => x.risk_flag === "HIGH"
        ).length;

    const medium =
        data.filter(
            x => x.risk_flag === "MEDIUM"
        ).length;

    const low =
        data.filter(
            x => x.risk_flag === "LOW"
        ).length;

    pieChart =
        new Chart(
            document.getElementById(
                "pieChart"
            ),
            {
                type: "pie",

                data: {
                    labels: [
                        "HIGH",
                        "MEDIUM",
                        "LOW"
                    ],

                    datasets: [{
                        data: [
                            high,
                            medium,
                            low
                        ],

                        backgroundColor: [
                            "#ef4444",
                            "#f59e0b",
                            "#22c55e"
                        ]
                    }]
                }
            }
        );
}

// =====================================
// DOUGHNUT CHART
// =====================================

function createDoughnutChart(data) {

    const counts = {};

    data.forEach(item => {

        counts[item.oem] =
            (counts[item.oem] || 0) + 1;
    });

    doughnutChart =
        new Chart(
            document.getElementById(
                "doughnutChart"
            ),
            {
                type: "doughnut",

                data: {
                    labels:
                        Object.keys(counts),

                    datasets: [{
                        data:
                            Object.values(counts)
                    }]
                }
            }
        );
}

// =====================================
// LINE CHART
// =====================================

function createLineChart(data) {

    lineChart =
        new Chart(
            document.getElementById(
                "lineChart"
            ),
            {
                type: "line",

                data: {

                    labels:
                        data.map(
                            x => x.product
                        ),

                    datasets: [{
                        label:
                            "Shortage Qty",

                        data:
                            data.map(
                                x => x.shortage_qty
                            ),

                        borderColor:
                            "#dc2626",

                        fill: false
                    }]
                }
            }
        );
}

// =====================================
// DOWNLOAD PDF
// =====================================
function downloadPDF(){

    const originalTitle = document.title;

    document.title = "Production Dashboard Report";

    window.print();

    document.title = originalTitle;
}