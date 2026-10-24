import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional


def calculate_slope(v1: float, v2: float, t1: float = 24.0, t2: float = 48.0) -> Optional[float]:
    """
    Computes parameter rate of change:
    Slope = (V2 - V1) / (t2 - t1)
    """
    if v1 is None or v2 is None or math.isnan(v1) or math.isnan(v2):
        return None
    delta_t = t2 - t1
    if delta_t == 0:
        return 0.0
    return (v2 - v1) / delta_t


def screen_components(
    df: pd.DataFrame,
    ml_predictions: Dict[str, Any],
    threshold_slope: Optional[float] = 0.0015,
    threshold_voltage: Optional[float] = 0.08,
    t1: float = 24.0,
    t2: float = 48.0
) -> List[Dict[str, Any]]:
    """
    Applies engineering screening logic:
    - PASS: Component within slope & voltage tolerance, no unsupervised anomaly.
    - FLAG: Component exhibits elevated drift, out-of-spec predicted 168h value,
            or Isolation Forest anomaly. Needs further bench inspection before packaging.
    - INVALID DATA: Corrupted telemetry, negative physical values, missing required interval data.
    - THRESHOLD REQUIRED: Safety threshold was omitted or not configured by the engineer.
    """
    results = []

    anomaly_scores = ml_predictions.get("anomaly_scores", [])
    is_anomalies = ml_predictions.get("is_anomaly", [])
    pred_168hs = ml_predictions.get("pred_168h", [])

    for idx, row in df.iterrows():
        comp_id = str(row.get("component_id", f"CMP-{idx+1}"))
        lot = str(row.get("lot_number", "LOT-STD"))
        c_type = str(row.get("component_type", "MOSFET"))
        temp_c = float(row.get("temp_c")) if pd.notna(row.get("temp_c")) else 125.0
        leakage = float(row.get("leakage_current_ua")) if pd.notna(row.get("leakage_current_ua")) else 0.0

        v0 = float(row.get("v_0h")) if pd.notna(row.get("v_0h")) else None
        v24 = float(row.get("v_24h")) if pd.notna(row.get("v_24h")) else None
        v48 = float(row.get("v_48h")) if pd.notna(row.get("v_48h")) else None
        v72 = float(row.get("v_72h")) if pd.notna(row.get("v_72h")) else None
        v168_act = float(row.get("v_168h_actual")) if pd.notna(row.get("v_168h_actual")) else None

        v168_pred = pred_168hs[idx] if idx < len(pred_168hs) else None
        anom_score = anomaly_scores[idx] if idx < len(anomaly_scores) else None
        is_anom = is_anomalies[idx] if idx < len(is_anomalies) else False

        # 1. Check for THRESHOLD REQUIRED
        if threshold_slope is None or math.isnan(threshold_slope) or threshold_slope <= 0:
            results.append({
                "component_id": comp_id,
                "lot_number": lot,
                "component_type": c_type,
                "v_0h": v0,
                "v_24h": v24,
                "v_48h": v48,
                "v_72h": v72,
                "v_168h_actual": v168_act,
                "v_168h_pred": v168_pred,
                "temp_c": temp_c,
                "leakage_current_ua": leakage,
                "slope_24_48": None,
                "pred_slope": None,
                "total_drift_percent": None,
                "anomaly_score": anom_score,
                "is_anomaly": is_anom,
                "status": "THRESHOLD REQUIRED",
                "reason": "Configurable safety slope threshold is unconfigured or zero. Set a valid threshold to screen."
            })
            continue

        # 2. Check for INVALID DATA
        # Physical impossibility checks: negative initial voltage, negative leakage, or missing 24h/48h read
        if (
            v0 is None or v24 is None or v48 is None or
            v0 <= 0 or v24 <= 0 or v48 <= 0 or
            leakage < 0 or
            math.isnan(v0) or math.isnan(v24) or math.isnan(v48)
        ):
            results.append({
                "component_id": comp_id,
                "lot_number": lot,
                "component_type": c_type,
                "v_0h": v0,
                "v_24h": v24,
                "v_48h": v48,
                "v_72h": v72,
                "v_168h_actual": v168_act,
                "v_168h_pred": v168_pred,
                "temp_c": temp_c,
                "leakage_current_ua": leakage,
                "slope_24_48": None,
                "pred_slope": None,
                "total_drift_percent": None,
                "anomaly_score": anom_score,
                "is_anomaly": is_anom,
                "status": "INVALID DATA",
                "reason": "Invalid telemetry: missing burn-in measurements (24h/48h) or non-physical negative values detected."
            })
            continue

        # 3. Compute Slope = (V2 - V1) / (t2 - t1)
        slope_24_48 = calculate_slope(v24, v48, t1, t2)
        
        # Predicted full slope: (V168_pred - V0) / 168.0
        pred_slope = (v168_pred - v0) / 168.0 if v168_pred is not None and v0 is not None else slope_24_48
        
        # Total drift percentage
        total_drift_pct = abs((v168_pred - v0) / v0) * 100.0 if v168_pred is not None and v0 else 0.0

        # 4. Evaluate PASS vs FLAG
        flag_reasons = []
        
        # Criteria A: Early Slope exceeded safety threshold
        if abs(slope_24_48) > threshold_slope:
            flag_reasons.append(
                f"Burn-in slope |{slope_24_48:.6f} V/h| exceeds safety limit (±{threshold_slope:.6f} V/h)"
            )

        # Criteria B: Predicted 168h drift exceeds maximum allowable voltage drift
        if threshold_voltage is not None and v168_pred is not None and v0 is not None:
            v_drift = abs(v168_pred - v0)
            if v_drift > threshold_voltage:
                flag_reasons.append(
                    f"Predicted 168h drift ({v_drift:.4f} V) exceeds tolerance ({threshold_voltage:.4f} V)"
                )

        # Criteria C: Isolation Forest detected multi-parameter outlier signature
        if is_anom:
            flag_reasons.append(
                f"Isolation Forest flagged multidimensional anomaly (score: {anom_score:.4f})"
            )

        # Criteria D: Excessive leakage current at operating temperature (> 50 uA)
        if leakage > 50.0:
            flag_reasons.append(
                f"High junction leakage current detected ({leakage:.2f} µA at {temp_c}°C)"
            )

        if len(flag_reasons) > 0:
            status = "FLAG"
            reason = "; ".join(flag_reasons) + ". Recommended: bench inspection and curve tracer verification."
        else:
            status = "PASS"
            reason = "Parameters exhibit stable burn-in drift within strict tolerance margins."

        results.append({
            "component_id": comp_id,
            "lot_number": lot,
            "component_type": c_type,
            "v_0h": v0,
            "v_24h": v24,
            "v_48h": v48,
            "v_72h": v72,
            "v_168h_actual": v168_act,
            "v_168h_pred": v168_pred,
            "temp_c": temp_c,
            "leakage_current_ua": leakage,
            "slope_24_48": round(slope_24_48, 6) if slope_24_48 is not None else None,
            "pred_slope": round(pred_slope, 6) if pred_slope is not None else None,
            "total_drift_percent": round(total_drift_pct, 2),
            "anomaly_score": round(anom_score, 4) if anom_score is not None else None,
            "is_anomaly": is_anom,
            "status": status,
            "reason": reason
        })

    return results
