from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from statistics import mean

from db import get_connection

app = FastAPI()

# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
   allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Production Dashboard API Running"
    }

# ==========================================
# ALL ALERTS
# ==========================================

@app.get("/alerts")
def get_alerts():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM alerts")

    rows = cur.fetchall()

    data = []

    for r in rows:
        data.append({
            "id": r[0],
            "product": r[1],
            "description": r[2],
            "plant": r[3],
            "oem": r[4],
            "customer": r[5],
            "supplier": r[6],
            "supplier_name": r[7],
            "requested_date": str(r[8]),
            "month": r[9],
            "requested_qty": r[10],
            "supplied_qty": r[11],
            "shortage_qty": r[12],
            "adherence": r[13],
            "risk_flag": r[14],
            "escalation_level": r[15],
            "catagory": r[16],
            "tier1": r[17],
            "created_at": str(r[18])
        })

    conn.close()

    return data

# ==========================================
# DASHBOARD ANALYTICS
# ==========================================

@app.get("/analytics")
def get_analytics():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM alerts")

    rows = cur.fetchall()

    conn.close()

    total_records = len(rows)

    total_shortage = sum(
        float(r[12])
        for r in rows
    ) if rows else 0

    avg_adherence = round(
        mean([float(r[13]) for r in rows]),
        2
    ) if rows else 0

    high_risk = len(
        [r for r in rows if r[14] == "HIGH"]
    )

    medium_risk = len(
        [r for r in rows if r[14] == "MEDIUM"]
    )

    low_risk = len(
        [r for r in rows if r[14] == "LOW"]
    )

    total_requested = sum(
        float(r[10])
        for r in rows
    ) if rows else 0

    total_supplied = sum(
        float(r[11])
        for r in rows
    ) if rows else 0

    unique_suppliers = len(
        set(r[7] for r in rows)
    )

    return {
        "total_records": total_records,
        "avg_adherence": avg_adherence,
        "total_shortage": total_shortage,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "total_requested": total_requested,
        "total_supplied": total_supplied,
        "unique_suppliers": unique_suppliers
    }

# ==========================================
# FILTERED ANALYTICS
# ==========================================

@app.get("/analytics-filtered")
def analytics_filtered(
    oem: str = Query(None),
    plant: str = Query(None),
    risk: str = Query(None)
):

    conn = get_connection()
    cur = conn.cursor()

    query = """
    SELECT *
    FROM alerts
    WHERE
        (%s IS NULL OR oem = %s)
    AND (%s IS NULL OR plant = %s)
    AND (%s IS NULL OR risk_flag = %s)
    """

    cur.execute(
        query,
        (
            oem, oem,
            plant, plant,
            risk, risk
        )
    )

    rows = cur.fetchall()

    conn.close()

    total_records = len(rows)

    total_shortage = sum(
        float(r[12])
        for r in rows
    ) if rows else 0

    avg_adherence = round(
        sum(float(r[13]) for r in rows) / len(rows),
        2
    ) if rows else 0

    high_risk = len(
        [r for r in rows if r[14] == "HIGH"]
    )

    return {
        "total_records": total_records,
        "avg_adherence": avg_adherence,
        "total_shortage": total_shortage,
        "high_risk": high_risk
    }

# ==========================================
# BACKUP PDF EXPORT
# ==========================================

@app.get("/download-pdf-full")
def download_full_pdf(
    oem: str = Query(None),
    plant: str = Query(None),
    risk: str = Query(None)
):

    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table
    )

    from reportlab.lib.styles import getSampleStyleSheet

    conn = get_connection()
    cur = conn.cursor()

    query = """
    SELECT *
    FROM alerts
    WHERE
        (%s IS NULL OR oem = %s)
    AND (%s IS NULL OR plant = %s)
    AND (%s IS NULL OR risk_flag = %s)
    """

    cur.execute(
        query,
        (
            oem, oem,
            plant, plant,
            risk, risk
        )
    )

    rows = cur.fetchall()

    conn.close()

    doc = SimpleDocTemplate(
        "dashboard.pdf"
    )

    styles = getSampleStyleSheet()

    elements = []

    elements.append(
        Paragraph(
            "Production Dashboard Report",
            styles["Title"]
        )
    )

    elements.append(
        Spacer(1, 20)
    )

    total_records = len(rows)

    total_shortage = sum(
        float(r[12])
        for r in rows
    ) if rows else 0

    avg_adherence = round(
        sum(float(r[13]) for r in rows) / len(rows),
        2
    ) if rows else 0

    elements.append(
        Paragraph(
            f"Total Records: {total_records}",
            styles["Heading2"]
        )
    )

    elements.append(
        Paragraph(
            f"Average Adherence: {avg_adherence}",
            styles["Heading2"]
        )
    )

    elements.append(
        Paragraph(
            f"Total Shortage: {total_shortage}",
            styles["Heading2"]
        )
    )

    elements.append(
        Spacer(1, 20)
    )

    table_data = [[
        "Product",
        "OEM",
        "Plant",
        "Requested Qty",
        "Supplied Qty",
        "Shortage Qty",
        "Adherence",
        "Risk"
    ]]

    for r in rows:
        table_data.append([
            r[1],
            r[4],
            r[3],
            r[10],
            r[11],
            r[12],
            r[13],
            r[14]
        ])

    elements.append(
        Table(table_data)
    )

    doc.build(elements)

    return FileResponse(
        "dashboard.pdf",
        media_type="application/pdf",
        filename="dashboard.pdf"
    )