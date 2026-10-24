import io
import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
import pandas as pd

from app.database import (
    init_db, get_db,
    DatasetRecord, ScreeningRunRecord, ComponentResultRecord
)
from app.schemas import (
    ScreeningConfigRequest, ScreeningRunSummary,
    ScreeningRunDetailResponse, ValidationResult, ComponentDetail
)
from app.ml_engine import BurnInMLEngine
from app.screening import screen_components
from app.sample_data import generate_synthetic_burnin_dataset, get_sample_csv_bytes
from app.pdf_exporter import generate_screening_pdf

# Initialize Database tables
init_db()

app = FastAPI(
    title="AI-Driven Component Burn-In Screening API",
    description="Electronic component anomaly detection & 168h lifetime degradation forecasting",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global ML Engine Instance
ml_engine = BurnInMLEngine(contamination=0.04)


@app.on_event("startup")
def startup_event():
    # If no data exists, generate initial synthetic demonstration run
    db = next(get_db())
    try:
        run_count = db.query(ScreeningRunRecord).count()
        if run_count == 0:
            df = generate_synthetic_burnin_dataset(100, random_seed=42)
            dataset = DatasetRecord(
                filename="demo_synthetic_jedec_lot.csv",
                total_rows=len(df),
                is_synthetic=True,
                description="Default Synthetic JEDEC/MIL-STD Burn-In Sample Dataset"
            )
            db.add(dataset)
            db.commit()
            db.refresh(dataset)

            # Train ML and screen
            ml_engine.train(df)
            preds = ml_engine.predict(df)
            results = screen_components(df, preds, threshold_slope=0.0015, threshold_voltage=0.08)

            pass_c = sum(1 for r in results if r["status"] == "PASS")
            flag_c = sum(1 for r in results if r["status"] == "FLAG")
            inv_c = sum(1 for r in results if r["status"] == "INVALID DATA")
            req_c = sum(1 for r in results if r["status"] == "THRESHOLD REQUIRED")

            eval_res = ml_engine.evaluate_predictions(
                y_true=df.get("v_168h_actual", pd.Series()),
                y_pred=pd.Series(preds.get("pred_168h", [])),
                actual_labels=df.get("true_status", None),
                pred_labels=pd.Series([r["status"] for r in results])
            )
            reg_m = eval_res.get("regression") or {}

            run = ScreeningRunRecord(
                dataset_id=dataset.id,
                threshold_slope=0.0015,
                threshold_voltage=0.08,
                total_count=len(results),
                pass_count=pass_c,
                flag_count=flag_c,
                invalid_count=inv_c,
                threshold_req_count=req_c,
                mae=reg_m.get("mae"),
                rmse=reg_m.get("rmse"),
                r2=reg_m.get("r2"),
                notes=json.dumps(eval_res)
            )
            db.add(run)
            db.commit()
            db.refresh(run)

            for r in results:
                c_rec = ComponentResultRecord(
                    run_id=run.id,
                    component_id=r["component_id"],
                    lot_number=r["lot_number"],
                    component_type=r["component_type"],
                    v_0h=r["v_0h"],
                    v_24h=r["v_24h"],
                    v_48h=r["v_48h"],
                    v_72h=r["v_72h"],
                    v_168h_actual=r["v_168h_actual"],
                    v_168h_pred=r["v_168h_pred"],
                    temp_c=r["temp_c"],
                    leakage_current_ua=r["leakage_current_ua"],
                    slope_24_48=r["slope_24_48"],
                    pred_slope=r["pred_slope"],
                    total_drift_percent=r["total_drift_percent"],
                    anomaly_score=r["anomaly_score"],
                    is_anomaly=r["is_anomaly"],
                    status=r["status"],
                    reason=r["reason"]
                )
                db.add(c_rec)
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Burn-In Screening Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "ml_trained": ml_engine.is_trained
    }


@app.get("/api/dataset/sample")
def download_sample_data():
    """Returns downloadable synthetic CSV dataset clearly labeled."""
    csv_bytes = get_sample_csv_bytes()
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=synthetic_burnin_sample_dataset.csv"}
    )


def normalize_dataset_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Intelligently maps various column naming conventions to standard burn-in fields:
    - value_0h, v_0h, voltage_0h, 0h -> v_0h
    - value_24h, v_24h, voltage_24h, 24h -> v_24h
    - value_48h, value_96h, value_72h, v_48h, v_96h -> v_48h (with corresponding t2 hours)
    - value_168h, v_168h, v_168h_actual -> v_168h_actual
    - lot_id, lot_number, lot_no, lot -> lot_number
    - component_id, comp_id, dut_id, id -> component_id
    - parameter, component_type, part_type -> component_type
    """
    col_map = {}
    lower_cols = {str(c).lower().strip(): c for c in df.columns}

    # 0h / baseline
    for candidate in ['value_0h', 'val_0h', 'v_0h', 'voltage_0h', 'v0', '0h', 'hour_0', 'val_0']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'v_0h'
            break

    # 24h
    for candidate in ['value_24h', 'val_24h', 'v_24h', 'voltage_24h', 'v24', '24h', 'hour_24', 'val_24']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'v_24h'
            break

    # Intermediate checkpoint: 48h, 96h, 72h
    t1 = 24.0
    t2 = 48.0
    if any(c in lower_cols for c in ['value_48h', 'v_48h', 'val_48h', '48h', 'hour_48']):
        c_found = next(c for c in ['value_48h', 'v_48h', 'val_48h', '48h', 'hour_48'] if c in lower_cols)
        col_map[lower_cols[c_found]] = 'v_48h'
        t2 = 48.0
    elif any(c in lower_cols for c in ['value_96h', 'v_96h', 'val_96h', '96h', 'hour_96']):
        c_found = next(c for c in ['value_96h', 'v_96h', 'val_96h', '96h', 'hour_96'] if c in lower_cols)
        col_map[lower_cols[c_found]] = 'v_48h'
        t2 = 96.0
    elif any(c in lower_cols for c in ['value_72h', 'v_72h', 'val_72h', '72h', 'hour_72']):
        c_found = next(c for c in ['value_72h', 'v_72h', 'val_72h', '72h', 'hour_72'] if c in lower_cols)
        col_map[lower_cols[c_found]] = 'v_48h'
        t2 = 72.0

    # 168h target
    for candidate in ['value_168h', 'val_168h', 'v_168h', 'v_168h_actual', 'voltage_168h', '168h', 'hour_168', 'val_168']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'v_168h_actual'
            break

    # lot
    for candidate in ['lot_id', 'lot_number', 'lot_no', 'lot', 'batch_id', 'batch']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'lot_number'
            break

    # component_id
    for candidate in ['component_id', 'comp_id', 'part_id', 'device_id', 'id', 'serial_number', 'dut_id', 'dut']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'component_id'
            break

    # component_type / parameter
    for candidate in ['component_type', 'parameter', 'part_type', 'param_name', 'device_type', 'type', 'param']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'component_type'
            break

    # temp_c
    for candidate in ['temp_c', 'temperature', 'temp', 'ambient_temp', 'junction_temp']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'temp_c'
            break

    # leakage_current_ua
    for candidate in ['leakage_current_ua', 'leakage_current', 'leakage_ua', 'ileak_ua', 'ileak', 'leakage']:
        if candidate in lower_cols:
            col_map[lower_cols[candidate]] = 'leakage_current_ua'
            break

    norm_df = df.rename(columns=col_map).copy()
    meta = {
        'mapped_columns': col_map,
        't1': t1,
        't2': t2
    }
    return norm_df, meta


@app.post("/api/dataset/validate")
async def validate_dataset(file: UploadFile = File(...)):
    """
    Validates uploaded CSV or Excel file columns and previews the first 5 rows.
    Supports flexible schemas (e.g. value_0h, value_24h, value_96h, value_168h, lot_id).
    """
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            raw_df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith((".xlsx", ".xls")):
            raw_df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel files (.xlsx, .xls) are supported.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    norm_df, meta = normalize_dataset_columns(raw_df)
    detected = raw_df.columns.tolist()

    required_normalized = ["v_0h", "v_24h", "v_48h"]
    missing_req = []
    
    if "v_0h" not in norm_df.columns:
        missing_req.append("Initial reading (e.g. value_0h or v_0h)")
    if "v_24h" not in norm_df.columns:
        missing_req.append("Early reading (e.g. value_24h or v_24h)")
    if "v_48h" not in norm_df.columns:
        missing_req.append("Intermediate reading (e.g. value_96h, value_48h, or v_48h)")

    warnings = []
    if meta['t2'] != 48.0:
        warnings.append(f"Intermediate burn-in interval detected at t2 = {int(meta['t2'])} hours (Slope formula adjusted).")

    preview_rows = raw_df.head(5).fillna("").to_dict(orient="records")

    return ValidationResult(
        valid=(len(missing_req) == 0),
        total_rows=len(raw_df),
        detected_columns=detected,
        missing_required_columns=missing_req,
        sample_preview=preview_rows,
        warnings=warnings
    )


@app.post("/api/dataset/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    threshold_slope: float = Form(0.0015),
    threshold_voltage: float = Form(0.08),
    contamination_rate: float = Form(0.04),
    db: Session = Depends(get_db)
):
    """
    Uploads a dataset, normalizes columns, trains ML models, runs screening, and persists results.
    """
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            raw_df = pd.read_csv(io.BytesIO(content))
        else:
            raw_df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File parse error: {str(e)}")

    norm_df, meta = normalize_dataset_columns(raw_df)
    t1 = meta['t1']
    t2 = meta['t2']

    is_synth = "synthetic" in file.filename.lower() or "synthetic" in raw_df.columns

    dataset = DatasetRecord(
        filename=file.filename,
        total_rows=len(norm_df),
        is_synthetic=is_synth,
        description=f"Uploaded {file.filename} with {len(norm_df)} components (Interval: {int(t1)}h to {int(t2)}h)"
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Train and evaluate ML engine using dynamic t1 and t2
    ml_engine.contamination = contamination_rate
    ml_engine.iso_forest.set_params(contamination=contamination_rate)
    ml_engine.train(norm_df, t1=t1, t2=t2)

    preds = ml_engine.predict(norm_df, t1=t1, t2=t2)
    results = screen_components(
        norm_df,
        preds,
        threshold_slope=threshold_slope,
        threshold_voltage=threshold_voltage,
        t1=t1,
        t2=t2
    )

    pass_c = sum(1 for r in results if r["status"] == "PASS")
    flag_c = sum(1 for r in results if r["status"] == "FLAG")
    inv_c = sum(1 for r in results if r["status"] == "INVALID DATA")
    req_c = sum(1 for r in results if r["status"] == "THRESHOLD REQUIRED")

    eval_res = ml_engine.evaluate_predictions(
        y_true=norm_df["v_168h_actual"] if "v_168h_actual" in norm_df.columns else pd.Series(),
        y_pred=pd.Series(preds.get("pred_168h", [])),
        actual_labels=norm_df["true_status"] if "true_status" in norm_df.columns else None,
        pred_labels=pd.Series([r["status"] for r in results])
    )
    reg_m = eval_res.get("regression") or {}

    run = ScreeningRunRecord(
        dataset_id=dataset.id,
        threshold_slope=threshold_slope,
        threshold_voltage=threshold_voltage,
        total_count=len(results),
        pass_count=pass_c,
        flag_count=flag_c,
        invalid_count=inv_c,
        threshold_req_count=req_c,
        mae=reg_m.get("mae"),
        rmse=reg_m.get("rmse"),
        r2=reg_m.get("r2"),
        notes=json.dumps(eval_res)
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    for r in results:
        c_rec = ComponentResultRecord(
            run_id=run.id,
            component_id=r["component_id"],
            lot_number=r["lot_number"],
            component_type=r["component_type"],
            v_0h=r["v_0h"],
            v_24h=r["v_24h"],
            v_48h=r["v_48h"],
            v_72h=r["v_72h"],
            v_168h_actual=r["v_168h_actual"],
            v_168h_pred=r["v_168h_pred"],
            temp_c=r["temp_c"],
            leakage_current_ua=r["leakage_current_ua"],
            slope_24_48=r["slope_24_48"],
            pred_slope=r["pred_slope"],
            total_drift_percent=r["total_drift_percent"],
            anomaly_score=r["anomaly_score"],
            is_anomaly=r["is_anomaly"],
            status=r["status"],
            reason=r["reason"]
        )
        db.add(c_rec)
    db.commit()

    return {"status": "success", "run_id": run.id, "total_screened": len(results)}


@app.post("/api/dataset/generate-synthetic")
def generate_synthetic_run(
    num_samples: int = Query(120, ge=10, le=1000),
    threshold_slope: float = Query(0.0015),
    threshold_voltage: float = Query(0.08),
    db: Session = Depends(get_db)
):
    """
    Generates a synthetic burn-in lot on the fly and screens it.
    """
    df = generate_synthetic_burnin_dataset(num_samples=num_samples)
    dataset = DatasetRecord(
        filename=f"synthetic_lot_{datetime.utcnow().strftime('%H%M%S')}.csv",
        total_rows=len(df),
        is_synthetic=True,
        description=f"Generated synthetic burn-in test dataset ({num_samples} units)"
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    ml_engine.train(df)
    preds = ml_engine.predict(df)
    results = screen_components(df, preds, threshold_slope=threshold_slope, threshold_voltage=threshold_voltage)

    pass_c = sum(1 for r in results if r["status"] == "PASS")
    flag_c = sum(1 for r in results if r["status"] == "FLAG")
    inv_c = sum(1 for r in results if r["status"] == "INVALID DATA")
    req_c = sum(1 for r in results if r["status"] == "THRESHOLD REQUIRED")

    eval_res = ml_engine.evaluate_predictions(
        y_true=df["v_168h_actual"],
        y_pred=pd.Series(preds.get("pred_168h", [])),
        actual_labels=df["true_status"],
        pred_labels=pd.Series([r["status"] for r in results])
    )
    reg_m = eval_res.get("regression") or {}

    run = ScreeningRunRecord(
        dataset_id=dataset.id,
        threshold_slope=threshold_slope,
        threshold_voltage=threshold_voltage,
        total_count=len(results),
        pass_count=pass_c,
        flag_count=flag_c,
        invalid_count=inv_c,
        threshold_req_count=req_c,
        mae=reg_m.get("mae"),
        rmse=reg_m.get("rmse"),
        r2=reg_m.get("r2"),
        notes=json.dumps(eval_res)
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    for r in results:
        c_rec = ComponentResultRecord(
            run_id=run.id,
            component_id=r["component_id"],
            lot_number=r["lot_number"],
            component_type=r["component_type"],
            v_0h=r["v_0h"],
            v_24h=r["v_24h"],
            v_48h=r["v_48h"],
            v_72h=r["v_72h"],
            v_168h_actual=r["v_168h_actual"],
            v_168h_pred=r["v_168h_pred"],
            temp_c=r["temp_c"],
            leakage_current_ua=r["leakage_current_ua"],
            slope_24_48=r["slope_24_48"],
            pred_slope=r["pred_slope"],
            total_drift_percent=r["total_drift_percent"],
            anomaly_score=r["anomaly_score"],
            is_anomaly=r["is_anomaly"],
            status=r["status"],
            reason=r["reason"]
        )
        db.add(c_rec)
    db.commit()

    return {"status": "success", "run_id": run.id}


@app.get("/api/runs")
def list_runs(db: Session = Depends(get_db)):
    runs = db.query(ScreeningRunRecord).order_by(ScreeningRunRecord.run_at.desc()).all()
    results = []
    for r in runs:
        results.append({
            "id": r.id,
            "dataset_name": r.dataset.filename if r.dataset else "Ad-hoc Run",
            "is_synthetic": r.dataset.is_synthetic if r.dataset else True,
            "run_at": r.run_at.isoformat(),
            "threshold_slope": r.threshold_slope,
            "threshold_voltage": r.threshold_voltage,
            "total_count": r.total_count,
            "pass_count": r.pass_count,
            "flag_count": r.flag_count,
            "invalid_count": r.invalid_count,
            "threshold_req_count": r.threshold_req_count,
            "mae": r.mae,
            "rmse": r.rmse,
            "r2": r.r2
        })
    return results


@app.get("/api/runs/{run_id}")
def get_run_details(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ScreeningRunRecord).filter(ScreeningRunRecord.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Screening run not found")

    components = db.query(ComponentResultRecord).filter(ComponentResultRecord.run_id == run_id).all()
    
    comp_list = []
    for c in components:
        comp_list.append({
            "id": c.id,
            "component_id": c.component_id,
            "lot_number": c.lot_number,
            "component_type": c.component_type,
            "v_0h": c.v_0h,
            "v_24h": c.v_24h,
            "v_48h": c.v_48h,
            "v_72h": c.v_72h,
            "v_168h_actual": c.v_168h_actual,
            "v_168h_pred": c.v_168h_pred,
            "temp_c": c.temp_c,
            "leakage_current_ua": c.leakage_current_ua,
            "slope_24_48": c.slope_24_48,
            "pred_slope": c.pred_slope,
            "total_drift_percent": c.total_drift_percent,
            "anomaly_score": c.anomaly_score,
            "is_anomaly": c.is_anomaly,
            "status": c.status,
            "reason": c.reason
        })

    # Parse evaluation metrics if present
    eval_data = json.loads(run.notes) if run.notes else None

    # Compute KPIs
    pass_rate = round((run.pass_count / run.total_count) * 100, 2) if run.total_count else 0
    flag_rate = round((run.flag_count / run.total_count) * 100, 2) if run.total_count else 0
    avg_slope = (
        sum(c["slope_24_48"] for c in comp_list if c["slope_24_48"] is not None) /
        max(1, sum(1 for c in comp_list if c["slope_24_48"] is not None))
    )

    kpis = {
        "total_screened": run.total_count,
        "pass_count": run.pass_count,
        "flag_count": run.flag_count,
        "invalid_count": run.invalid_count,
        "threshold_req_count": run.threshold_req_count,
        "pass_rate_pct": pass_rate,
        "flag_rate_pct": flag_rate,
        "avg_slope": round(avg_slope, 6),
        "threshold_slope": run.threshold_slope,
        "threshold_voltage": run.threshold_voltage,
        "mae": run.mae,
        "rmse": run.rmse,
        "r2": run.r2
    }

    return {
        "summary": {
            "id": run.id,
            "dataset_name": run.dataset.filename if run.dataset else "Dataset",
            "is_synthetic": run.dataset.is_synthetic if run.dataset else True,
            "run_at": run.run_at.isoformat(),
            "threshold_slope": run.threshold_slope,
            "threshold_voltage": run.threshold_voltage,
            "total_count": run.total_count,
            "pass_count": run.pass_count,
            "flag_count": run.flag_count,
            "invalid_count": run.invalid_count,
            "threshold_req_count": run.threshold_req_count,
            "mae": run.mae,
            "rmse": run.rmse,
            "r2": run.r2
        },
        "kpis": kpis,
        "components": comp_list,
        "evaluation": eval_data
    }


@app.get("/api/runs/{run_id}/export/csv")
def export_csv(run_id: int, db: Session = Depends(get_db)):
    components = db.query(ComponentResultRecord).filter(ComponentResultRecord.run_id == run_id).all()
    if not components:
        raise HTTPException(status_code=404, detail="No components found for this run")

    data = []
    for c in components:
        data.append({
            "component_id": c.component_id,
            "lot_number": c.lot_number,
            "component_type": c.component_type,
            "v_0h": c.v_0h,
            "v_24h": c.v_24h,
            "v_48h": c.v_48h,
            "v_72h": c.v_72h,
            "v_168h_pred": c.v_168h_pred,
            "v_168h_actual": c.v_168h_actual,
            "early_slope_V_per_hr": c.slope_24_48,
            "pred_full_slope": c.pred_slope,
            "drift_percent": c.total_drift_percent,
            "iso_anomaly_score": c.anomaly_score,
            "is_anomaly": c.is_anomaly,
            "status": c.status,
            "explanation": c.reason
        })

    df = pd.DataFrame(data)
    csv_str = df.to_csv(index=False)
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=screening_run_{run_id}_export.csv"}
    )


@app.get("/api/runs/{run_id}/export/pdf")
def export_pdf(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ScreeningRunRecord).filter(ScreeningRunRecord.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    components = db.query(ComponentResultRecord).filter(ComponentResultRecord.run_id == run_id).all()
    comp_dicts = [
        {
            "component_id": c.component_id,
            "lot_number": c.lot_number,
            "v_0h": c.v_0h,
            "v_24h": c.v_24h,
            "v_48h": c.v_48h,
            "v_168h_pred": c.v_168h_pred,
            "slope_24_48": c.slope_24_48,
            "status": c.status,
            "reason": c.reason
        }
        for c in components
    ]

    summary = {
        "total_count": run.total_count,
        "pass_count": run.pass_count,
        "flag_count": run.flag_count,
        "invalid_count": run.invalid_count,
        "threshold_slope": run.threshold_slope
    }

    pdf_bytes = generate_screening_pdf(summary, comp_dicts)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=screening_run_{run_id}_report.pdf"}
    )
