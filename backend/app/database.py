import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/burnin_screening.db"
else:
    DB_PATH = os.path.join(BASE_DIR, "data", "burnin_screening.db")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    total_rows = Column(Integer, default=0)
    is_synthetic = Column(Boolean, default=False)
    description = Column(String(500), nullable=True)

    runs = relationship("ScreeningRunRecord", back_populates="dataset", cascade="all, delete-orphan")


class ScreeningRunRecord(Base):
    __tablename__ = "screening_runs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    run_at = Column(DateTime, default=datetime.utcnow)
    threshold_slope = Column(Float, nullable=False, default=0.0015)
    threshold_voltage = Column(Float, nullable=True, default=0.05)
    total_count = Column(Integer, default=0)
    pass_count = Column(Integer, default=0)
    flag_count = Column(Integer, default=0)
    invalid_count = Column(Integer, default=0)
    threshold_req_count = Column(Integer, default=0)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    dataset = relationship("DatasetRecord", back_populates="runs")
    components = relationship("ComponentResultRecord", back_populates="run", cascade="all, delete-orphan")


class ComponentResultRecord(Base):
    __tablename__ = "component_results"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("screening_runs.id"), nullable=False)
    component_id = Column(String(64), index=True, nullable=False)
    lot_number = Column(String(64), index=True, nullable=True)
    component_type = Column(String(64), default="MOSFET / IC")
    
    # Measurements across burn-in timeline
    v_0h = Column(Float, nullable=True)
    v_24h = Column(Float, nullable=True)
    v_48h = Column(Float, nullable=True)
    v_72h = Column(Float, nullable=True)
    v_168h_actual = Column(Float, nullable=True)
    v_168h_pred = Column(Float, nullable=True)
    
    temp_c = Column(Float, nullable=True)
    leakage_current_ua = Column(Float, nullable=True)
    
    # Drift & Physics metrics
    slope_24_48 = Column(Float, nullable=True)  # (v_48h - v_24h) / (48 - 24)
    pred_slope = Column(Float, nullable=True)    # (v_168h_pred - v_0h) / 168
    total_drift_percent = Column(Float, nullable=True)
    
    # ML Outputs
    anomaly_score = Column(Float, nullable=True) # Isolation Forest raw decision function
    is_anomaly = Column(Boolean, default=False)
    
    # Final Decision
    status = Column(String(32), nullable=False) # PASS, FLAG, INVALID DATA, THRESHOLD REQUIRED
    reason = Column(Text, nullable=False)

    run = relationship("ScreeningRunRecord", back_populates="components")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
