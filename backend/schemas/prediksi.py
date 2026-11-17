from pydantic import BaseModel
from typing import Dict, List, Optional

class PrediksiResponse(BaseModel):
    mahasiswa_id: int
    semester: int
    risk_level: str
    risk_score: float
    algoritma_used: str
    rekomendasi: dict
    probabilities: Dict[str, float]
    features_used: Dict[str, float]

class TrainingResult(BaseModel):
    best_model: str
    best_f1: float
    comparison: List[dict]

class EvaluationResult(BaseModel):
    models: List[str]
    reports: Dict[str, dict]
