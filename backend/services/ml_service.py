import os
import joblib
import pandas as pd
import numpy as np
import json
import logging
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)
from imblearn.over_sampling import SMOTE

from models.mahasiswa import Mahasiswa
from models.akademik import AkademikSemester, Kehadiran, NilaiMatakuliah, AktivitasLMS, AktivitasPraktikum
from models.prediksi import PrediksiRisiko
from services.ews_service import get_rekomendasi

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = "ml_models"
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

def build_feature_matrix(db: Session) -> pd.DataFrame:
    """
    Membangun matriks fitur dari database untuk semua mahasiswa dan semester.
    Build feature matrix from database for all students and semesters.
    """
    logger.info("Building feature matrix from database...")
    
    # Query all academic semesters as base
    akademik_data = db.query(AkademikSemester).all()
    
    features = []
    for ak in akademik_data:
        mhs_id = ak.mahasiswa_id
        sem = ak.semester
        
        # 1-3. Basic academic
        row = {
            'mahasiswa_id': mhs_id,
            'semester': sem,
            'ip_semester': float(ak.ip_semester),
            'ip_kumulatif': float(ak.ip_kumulatif),
            'sks_diambil': ak.sks_diambil
        }
        
        # 4-5. Kehadiran
        kehadiran = db.query(Kehadiran).filter_by(mahasiswa_id=mhs_id, semester=sem).all()
        if kehadiran:
            pres_list = [float(k.persentase_kehadiran) for k in kehadiran]
            row['kehadiran_avg'] = np.mean(pres_list)
            row['kehadiran_min'] = np.min(pres_list)
        else:
            row['kehadiran_avg'] = 0.0
            row['kehadiran_min'] = 0.0
            
        # 6-8. Nilai & MK Ulang
        nilai = db.query(NilaiMatakuliah).filter_by(mahasiswa_id=mhs_id, semester=sem).all()
        if nilai:
            scores = [float(n.nilai_angka) for n in nilai]
            row['nilai_rata'] = np.mean(scores)
            row['jumlah_mk_nilai_d_e'] = sum(1 for n in nilai if n.nilai_huruf in ['D', 'E'])
            row['jumlah_mk_ulang'] = sum(1 for n in nilai if n.status_ulang)
        else:
            row['nilai_rata'] = 0.0
            row['jumlah_mk_nilai_d_e'] = 0
            row['jumlah_mk_ulang'] = 0
            
        # 9-12. LMS
        lms = db.query(AktivitasLMS).filter_by(mahasiswa_id=mhs_id, semester=sem).first()
        if lms:
            row['lms_login'] = lms.jumlah_login
            row['lms_submit'] = lms.jumlah_tugas_submit
            row['lms_terlambat'] = lms.jumlah_tugas_terlambat
            row['lms_score'] = (lms.jumlah_login * 0.3) + (lms.jumlah_tugas_submit * 0.5) - (lms.jumlah_tugas_terlambat * 0.2)
        else:
            row['lms_login'] = 0
            row['lms_submit'] = 0
            row['lms_terlambat'] = 0
            row['lms_score'] = 0.0
            
        # 13-14. Praktikum
        praktikum = db.query(AktivitasPraktikum).filter_by(mahasiswa_id=mhs_id, semester=sem).all()
        if praktikum:
            p_scores = [float(p.nilai_praktikum) for p in praktikum]
            p_pres = [float(p.kehadiran_praktikum) for p in praktikum]
            row['praktikum_avg'] = np.mean(p_scores)
            row['praktikum_hadir'] = np.mean(p_pres)
        else:
            row['praktikum_avg'] = 0.0
            row['praktikum_hadir'] = 0.0
            
        # 15. Semester ke
        row['semester_ke'] = sem
        
        # 16. Trend IP
        if sem > 1:
            prev_ak = db.query(AkademikSemester).filter_by(mahasiswa_id=mhs_id, semester=sem-1).first()
            if prev_ak:
                row['trend_ip'] = float(ak.ip_semester) - float(prev_ak.ip_semester)
            else:
                row['trend_ip'] = 0.0
        else:
            row['trend_ip'] = 0.0
            
        features.append(row)
        
    return pd.DataFrame(features)

def auto_label(row: pd.Series) -> str:
    """
    Pelabelan berbasis aturan untuk pembelajaran terarah.
    Rule-based labeling for supervised learning.
    """
    # TINGGI
    if (row['ip_kumulatif'] < 2.0 or 
        row['kehadiran_avg'] < 60.0 or 
        row['jumlah_mk_ulang'] >= 3 or 
        row['jumlah_mk_nilai_d_e'] >= 4):
        return 'tinggi'
    
    # SEDANG
    if (row['ip_kumulatif'] <= 2.75 or 
        row['kehadiran_avg'] <= 75.0 or 
        (1 <= row['jumlah_mk_ulang'] <= 2)):
        return 'sedang'
    
    # RENDAH
    return 'rendah'

def train_all_models(X_train, X_test, y_train, y_test, label_encoder):
    """
    Melatih dan mengevaluasi 5 model klasifikasi.
    Train and evaluate 5 classification models.
    """
    models = {
        'Decision Tree': DecisionTreeClassifier(max_depth=10, min_samples_split=5, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=200, max_depth=15, min_samples_split=5, random_state=42, n_jobs=-1),
        'Naive Bayes': GaussianNB(),
        'SVM': SVC(kernel='rbf', C=1.0, probability=True, random_state=42),
        'XGBoost': XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42, eval_metric='mlogloss')
    }
    
    results = {}
    for name, model in models.items():
        logger.info(f"Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='weighted')
        rec = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        auc = roc_auc_score(y_test, y_prob, multi_class='ovr', average='weighted')
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1_weighted')
        
        results[name] = {
            'model_obj': model,
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1': f1,
            'auc': auc,
            'cv_mean': np.mean(cv_scores),
            'cv_std': np.std(cv_scores),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'report': classification_report(y_test, y_pred, target_names=label_encoder.classes_, output_dict=True)
        }
        
    return results

def run_full_pipeline(db: Session):
    """
    Pipeline pelatihan lengkap: fitur -> label -> split -> scale -> train -> save.
    Complete training pipeline.
    """
    try:
        df = build_feature_matrix(db)
        if df.empty:
            return {"error": "No data found for training"}
            
        # Apply labels
        df['risk_level'] = df.apply(auto_label, axis=1)
        
        X = df.drop(['mahasiswa_id', 'semester', 'risk_level'], axis=1)
        y = df['risk_level']
        
        feature_names = X.columns.tolist()
        
        # Encode labels
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42)
        
        # Scale
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Imbalance check
        class_counts = pd.Series(y_train).value_counts()
        if (class_counts.max() / class_counts.min()) > 3:
            logger.info("Handling class imbalance with SMOTE...")
            smote = SMOTE(random_state=42)
            X_train_scaled, y_train = smote.fit_resample(X_train_scaled, y_train)
            
        # Train all
        all_results = train_all_models(X_train_scaled, X_test_scaled, y_train, y_test, le)
        
        # Select best by F1
        best_model_name = max(all_results, key=lambda x: all_results[x]['f1'])
        best_data = all_results[best_model_name]
        
        # Save artifacts
        joblib.dump(best_data['model_obj'], os.path.join(MODELS_DIR, 'best_model.pkl'))
        joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))
        joblib.dump(le, os.path.join(MODELS_DIR, 'label_encoder.pkl'))
        joblib.dump(feature_names, os.path.join(MODELS_DIR, 'feature_names.pkl'))
        
        comparison = []
        for name, res in all_results.items():
            comparison.append({
                'model': name,
                'accuracy': res['accuracy'],
                'precision': res['precision'],
                'recall': res['recall'],
                'f1': res['f1'],
                'auc': res['auc'],
                'cv_mean': res['cv_mean'],
                'cv_std': res['cv_std'],
                'confusion_matrix': res['confusion_matrix'],
                'is_best': name == best_model_name
            })
            
        with open(os.path.join(MODELS_DIR, 'evaluation_report.json'), 'w') as f:
            json.dump({'comparison': comparison}, f)
            
        return {
            "best_model": best_model_name,
            "best_f1": best_data['f1'],
            "comparison": comparison
        }
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        raise e

def predict_single(db: Session, mahasiswa_id: int, semester: int):
    """
    Prediksi risiko untuk satu mahasiswa pada semester tertentu.
    Predict risk for one student for a specific semester.
    """
    try:
        # Load artifacts
        model = joblib.load(os.path.join(MODELS_DIR, 'best_model.pkl'))
        scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
        le = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))
        feature_names = joblib.load(os.path.join(MODELS_DIR, 'feature_names.pkl'))
        
        # Build single row feature
        # This is a bit redundant but ensures consistency with build_feature_matrix
        df_all = build_feature_matrix(db)
        row = df_all[(df_all['mahasiswa_id'] == mahasiswa_id) & (df_all['semester'] == semester)]
        
        if row.empty:
            return {"error": "Student data not found for features"}
            
        X = row[feature_names]
        X_scaled = scaler.transform(X)
        
        # Predict
        pred_idx = model.predict(X_scaled)[0]
        prob = model.predict_proba(X_scaled)[0]
        
        risk_level = le.inverse_transform([pred_idx])[0]
        risk_score = float(np.max(prob) * 100)
        
        # Save to DB
        mhs = db.query(Mahasiswa).filter_by(id=mahasiswa_id).first()
        ak = db.query(AkademikSemester).filter_by(mahasiswa_id=mahasiswa_id, semester=semester).first()
        
        # Check if already exists
        existing = db.query(PrediksiRisiko).filter_by(mahasiswa_id=mahasiswa_id, semester=semester).first()
        rekom = get_rekomendasi(risk_level)
        
        if existing:
            existing.risk_level = risk_level
            existing.risk_score = risk_score
            existing.algoritma_used = str(type(model).__name__)
            existing.rekomendasi_intervensi = json.dumps(rekom)
        else:
            new_pred = PrediksiRisiko(
                mahasiswa_id=mahasiswa_id,
                semester=semester,
                tahun_akademik=ak.tahun_akademik,
                risk_level=risk_level,
                risk_score=risk_score,
                algoritma_used=str(type(model).__name__),
                rekomendasi_intervensi=json.dumps(rekom)
            )
            db.add(new_pred)
            
        db.commit()
        
        return {
            "mahasiswa_id": mahasiswa_id,
            "semester": semester,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "probabilities": {le.classes_[i]: float(prob[i]) for i in range(len(le.classes_))},
            "algoritma_used": str(type(model).__name__),
            "rekomendasi": rekom,
            "features_used": X.iloc[0].to_dict()
        }
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise e

def predict_all_students(db: Session):
    """
    Batch prediksi untuk semua mahasiswa aktif menggunakan data semester terbaru.
    Batch prediction for all active students using latest semester data.
    """
    mhs_ids = [m.id for m in db.query(Mahasiswa.id).filter_by(status_aktif='aktif').all()]
    results = []
    
    for mid in mhs_ids:
        latest_sem = db.query(func.max(AkademikSemester.semester)).filter_by(mahasiswa_id=mid).scalar()
        if latest_sem:
            res = predict_single(db, mid, latest_sem)
            results.append(res)
            
    # Summary
    counts = {'tinggi': 0, 'sedang': 0, 'rendah': 0}
    for r in results:
        if 'risk_level' in r:
            counts[r['risk_level']] += 1
            
    return {
        "total": len(results),
        "counts": counts
    }

def get_feature_importance():
    """
    Mendapatkan kepentingan fitur dari model terbaik yang disimpan.
    Get feature importance from best saved model.
    """
    try:
        model = joblib.load(os.path.join(MODELS_DIR, 'best_model.pkl'))
        feature_names = joblib.load(os.path.join(MODELS_DIR, 'feature_names.pkl'))
        
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            feat_imp = []
            for i, imp in enumerate(importances):
                feat_imp.append({
                    "feature": feature_names[i],
                    "importance": float(imp)
                })
            # Sort by importance
            feat_imp.sort(key=lambda x: x['importance'], reverse=True)
            # Add rank
            for i, item in enumerate(feat_imp):
                item['rank'] = i + 1
            return feat_imp
        return None
    except Exception:
        return None
