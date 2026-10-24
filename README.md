# AI-Driven Anomaly Detection and Burn-In Screening of Electronic Components

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-1.7+-228B22)](https://xgboost.readthedocs.io)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.2+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

A full-stack, production-grade engineering web application developed for semiconductor quality assurance, high-temperature operating life (HTOL) burn-in testing, and lifetime electrical parameter forecasting in compliance with **JEDEC JESD22-A108** and **MIL-STD-883 Method 1015**.

---

## 🚀 Key Features

1. **Modern Industrial Dashboard**:
   - Executive KPI cards: Total Screened, Pass Yield (%), Flag Rate (%), Mean Slope, and Model R².
   - Real-time dark mode and light mode toggle.
   - Interactive Recharts degradation curves and multidimensional scatter distributions.

2. **Dual-Model AI Screening Architecture**:
   - **Isolation Forest (Unsupervised)**: Detects anomalous early electrical signatures across multi-dimensional feature vectors (voltage drift, operating temperature, and junction leakage current).
   - **XGBoost Regressor (Supervised)**: Forecasts the final 168-hour end-of-test electrical parameter exclusively from early checkpoints (0h, 24h, 48h).

3. **Physics-Based Drift & Slope Formulation**:
   - Computes early parameter rate of shift:
     $$\text{Slope} = \frac{V_2 - V_1}{t_2 - t_1} = \frac{V_{48\text{h}} - V_{24\text{h}}}{48 - 24}$$
   - Evaluates early slope against configurable safety limits (Default: $\pm 0.0015\text{ V/hr}$).

4. **Strict Data Leakage Prevention**:
   - Feature pipelines are strictly quarantined: prediction models never peek into $72\text{h}$ or $168\text{h}$ values during inference.
   - Ground truth values are exclusively used during model validation.

5. **Explainable Screening Decision Engine**:
   - **PASS**: Stable physical settling within strict drift & slope tolerance margins.
   - **FLAG**: Elevated parameter slope, high junction leakage, or Isolation Forest outlier. *Important: FLAG indicates further bench curve-tracer inspection is required, not confirmed failure.*
   - **INVALID DATA**: Non-physical values (e.g. negative initial voltages, negative leakage currents, missing intermediate checkpoints).
   - **THRESHOLD REQUIRED**: Safety limit is omitted or unconfigured.

6. **Interactive Telemetry Detail Drawer**:
   - Inspect individual components, lot numbers, full burn-in trajectory curves, and decision explanations.

7. **Export Capabilities**:
   - **CSV Export**: Full raw component telemetry and model outputs.
   - **PDF Engineering Report**: Clean vector PDF report generated via ReportLab with executive summary and top telemetry records.

8. **Honest Model Evaluation (No Fabrication)**:
   - Regression metrics: MAE, RMSE, and $R^2$ variance explained.
   - Classification metrics: Accuracy, Precision, Recall, F1-Score, and Confusion Matrix (evaluated when ground truth labels are provided).

---

## 📁 Project Structure

```
Ai anomaly project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI server, endpoints, middleware
│   │   ├── database.py          # SQLite database schema (Datasets, Runs, Components)
│   │   ├── schemas.py           # Pydantic request/response validation
│   │   ├── ml_engine.py         # Isolation Forest & XGBoost pipelines
│   │   ├── screening.py         # Slope/drift formulas & PASS/FLAG rules
│   │   ├── sample_data.py       # JEDEC synthetic data generator (labeled clearly)
│   │   └── pdf_exporter.py      # ReportLab engineering report builder
│   ├── data/                    # SQLite database store
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header, lot badge, dark mode, quick actions
│   │   │   ├── Sidebar.jsx      # Navigation & operational chamber parameters
│   │   │   ├── KpiCards.jsx     # High-impact industrial metric cards
│   │   │   ├── ScreeningTable.jsx# Registry with search, sort, filter, exports
│   │   │   ├── TrendChart.jsx   # Comparative Recharts curves & scatter plot
│   │   │   ├── ComponentDetailModal.jsx # Single-component deep-dive
│   │   │   ├── EvaluationPanel.jsx # MAE, RMSE, R², Confusion Matrix
│   │   │   ├── SettingsModal.jsx# Configurable safety thresholds
│   │   │   └── StandardsView.jsx# JEDEC standards & formulas guide
│   │   ├── api.js               # API service connecting to FastAPI backend
│   │   ├── App.jsx              # Main layout & view coordinator
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── run_backend.ps1              # Launch FastAPI backend
├── run_frontend.ps1             # Launch Vite frontend
├── start_app.bat                # 1-Click launcher for Windows
└── README.md
```

---

## ⚡ Quick Start Guide (Windows)

### Option 1: 1-Click Launch
Double-click `start_app.bat` in the project root directory. It will automatically launch both the backend and frontend in separate command windows.

### Option 2: Manual Terminal Commands

#### 1. Start the FastAPI Backend
```powershell
# Open terminal in project root
.\run_backend.ps1
# Backend runs at http://localhost:8000
# Interactive API documentation: http://localhost:8000/docs
```

#### 2. Start the Vite React Frontend
```powershell
# Open another terminal in project root
.\run_frontend.ps1
# Frontend dashboard runs at http://localhost:5173
```

---

## 🧪 Testing Dataset Upload & Screening

1. Open `http://localhost:5173`.
2. Click **Download Sample CSV** in the upload dialog to inspect standard column formatting.
3. Click **Generate Synthetic Lot** to immediately test a new 120-unit semiconductor lot with randomized physical wear-out curves.
4. Try uploading your own custom CSV or Excel dataset to see real-time schema validation and screening decisions.
