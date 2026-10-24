import io
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def generate_screening_pdf(summary: Dict[str, Any], components: List[Dict[str, Any]]) -> bytes:
    """
    Generates a professional industrial engineering report PDF for burn-in screening.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=14
    )
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("Electronic Component Burn-In & Anomaly Screening Report", title_style))
    elements.append(Paragraph(
        f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Standard: JEDEC JESD22-A108 / MIL-STD-883",
        subtitle_style
    ))
    elements.append(Spacer(1, 10))

    # KPI Summary Table
    pass_cnt = summary.get("pass_count", 0)
    flag_cnt = summary.get("flag_count", 0)
    inv_cnt = summary.get("invalid_count", 0)
    tot_cnt = summary.get("total_count", 1) or 1
    pass_rate = round((pass_cnt / tot_cnt) * 100, 1)

    kpi_data = [
        ["Total Screened", "PASS", "FLAG (Review)", "INVALID DATA", "Yield (Pass Rate)", "Slope Limit"],
        [
            str(tot_cnt),
            str(pass_cnt),
            str(flag_cnt),
            str(inv_cnt),
            f"{pass_rate}%",
            f"±{summary.get('threshold_slope', 0.0015):.5f} V/h"
        ]
    ]

    t_kpi = Table(kpi_data, colWidths=[120, 100, 120, 120, 130, 130])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 18))

    # Top Sample Component Screening Results Table
    elements.append(Paragraph("<b>Component Telemetry & Decision Details</b> (Top Entries)", styles['Heading3']))
    elements.append(Spacer(1, 6))

    headers = ["ID", "Lot", "V(0h)", "V(24h)", "V(48h)", "V(168h Pred)", "Early Slope", "Status", "Inspection Note"]
    table_rows = [headers]

    for comp in components[:60]: # include top 60 in primary print
        status = comp.get("status", "N/A")
        s_color = "#16A34A" if status == "PASS" else ("#DC2626" if status == "FLAG" else "#D97706")
        
        slope_val = comp.get("slope_24_48")
        slope_str = f"{slope_val:.5f}" if slope_val is not None else "N/A"
        pred_val = comp.get("v_168h_pred")
        pred_str = f"{pred_val:.3f}" if pred_val is not None else "N/A"

        reason_snippet = comp.get("reason", "")
        if len(reason_snippet) > 65:
            reason_snippet = reason_snippet[:62] + "..."

        table_rows.append([
            comp.get("component_id", ""),
            comp.get("lot_number", ""),
            f"{comp.get('v_0h', 0):.3f}" if comp.get('v_0h') is not None else "N/A",
            f"{comp.get('v_24h', 0):.3f}" if comp.get('v_24h') is not None else "N/A",
            f"{comp.get('v_48h', 0):.3f}" if comp.get('v_48h') is not None else "N/A",
            pred_str,
            slope_str,
            Paragraph(f"<b><font color='{s_color}'>{status}</font></b>", cell_style),
            Paragraph(reason_snippet, cell_style)
        ])

    t_detail = Table(table_rows, colWidths=[65, 75, 45, 45, 45, 70, 70, 75, 230])
    t_detail.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (6, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    elements.append(t_detail)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
