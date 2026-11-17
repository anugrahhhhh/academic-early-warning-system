from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import os

from config.database import get_db
from services.ml_service import run_full_pipeline, predict_single, predict_all_students, get_feature_importance
from routers.auth import get_current_user

router = APIRouter(prefix="/api/ml", tags=["ml"])

@router.post("/train")
async def train_pipeline(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can train model")
    return run_full_pipeline(db)

@router.get("/evaluation")
async def get_evaluation():
    report_path = "ml_models/evaluation_report.json"
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="No evaluation report found. Train model first.")
    with open(report_path, 'r') as f:
        return json.load(f)

@router.post("/predict/{nim}")
async def predict_mhs(nim: str, semester: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == 'mahasiswa':
        raise HTTPException(status_code=403, detail="Akses ditolak")
    from models.mahasiswa import Mahasiswa
    m = db.query(Mahasiswa).filter_by(nim=nim).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")
    return predict_single(db, m.id, semester)

@router.post("/predict-all")
async def predict_all(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role not in ['admin', 'dosen_pa']:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return predict_all_students(db)

@router.get("/feature-importance")
async def feature_importance():
    importance = get_feature_importance()
    if importance is None:
        raise HTTPException(status_code=404, detail="No importance data found")
    return importance
