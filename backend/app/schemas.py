from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ScreeningConfigRequest(BaseModel):
    threshold_slope: Optional[float] = Field(default=0.0015, description="Maximum allowable slope (V/hour)")
    threshold_voltage: Optional[float] = Field(default=0.08, description="Maximum allowable voltage drift (V)")
    contamination_rate: Optional[float] = Field(default=0.04, description="Expected anomaly contamination for Isolation Forest")


class ComponentDetail(BaseModel):
    id: Optional[int] = None
    component_id: str
    lot_number: Optional[str] = "LOT-STD"
    component_type: Optional[str] = "MOSFET"
    v_0h: Optional[float] = None
    v_24h: Optional[float] = None
    v_48h: Optional[float] = None
    v_72h: Optional[float] = None
    v_168h_actual: Optional[float] = None
    v_168h_pred: Optional[float] = None
    temp_c: Optional[float] = None
    leakage_current_ua: Optional[float] = None
    slope_24_48: Optional[float] = None
    pred_slope: Optional[float] = None
    total_drift_percent: Optional[float] = None
    anomaly_score: Optional[float] = None
    is_anomaly: Optional[bool] = False
    status: str # PASS, FLAG, INVALID DATA, THRESHOLD REQUIRED
    reason: str

    class Config:
        from_attributes = True


class ScreeningRunSummary(BaseModel):
    id: int
    dataset_name: Optional[str] = "Unknown"
    run_at: datetime
    threshold_slope: float
    threshold_voltage: Optional[float] = 0.08
    total_count: int
    pass_count: int
    flag_count: int
    invalid_count: int
    threshold_req_count: int
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None

    class Config:
        from_attributes = True


class ScreeningRunDetailResponse(BaseModel):
    summary: ScreeningRunSummary
    components: List[ComponentDetail]
    kpis: Dict[str, Any]
    evaluation: Optional[Dict[str, Any]] = None


class ValidationResult(BaseModel):
    valid: bool
    total_rows: int
    detected_columns: List[str]
    missing_required_columns: List[str]
    sample_preview: List[Dict[str, Any]]
    warnings: List[str]
