from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from config.database import get_db
from models.mahasiswa import Mahasiswa
from models.prediksi import PrediksiRisiko
from models.intervensi import Intervensi
from models.akademik import AkademikSemester
from routers.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == 'mahasiswa':
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    query_mhs = db.query(Mahasiswa)
    query_int = db.query(Intervensi)
    
    # Filter jika Dosen PA
    if current_user.role == 'dosen_pa':
        query_mhs = query_mhs.filter(Mahasiswa.dosen_pa_id == current_user.id)
        query_int = query_int.filter(Intervensi.dosen_id == current_user.id)

    total_mhs = query_mhs.count()
    
    # Latest risk per student
    subquery = db.query(
        PrediksiRisiko.mahasiswa_id, 
        func.max(PrediksiRisiko.created_at).label('max_date')
    ).group_by(PrediksiRisiko.mahasiswa_id).subquery()
    
    latest_risks_query = db.query(PrediksiRisiko.risk_level, func.count(PrediksiRisiko.id))\
        .join(subquery, (PrediksiRisiko.mahasiswa_id == subquery.c.mahasiswa_id) & (PrediksiRisiko.created_at == subquery.c.max_date))
    
    if current_user.role == 'dosen_pa':
        latest_risks_query = latest_risks_query.join(Mahasiswa, Mahasiswa.id == PrediksiRisiko.mahasiswa_id)\
            .filter(Mahasiswa.dosen_pa_id == current_user.id)

    latest_risks = latest_risks_query.group_by(PrediksiRisiko.risk_level).all()
        
    risk_counts = {r[0]: r[1] for r in latest_risks}
    tinggi = risk_counts.get('tinggi', 0)
    sedang = risk_counts.get('sedang', 0)
    rendah = risk_counts.get('rendah', 0)
    
    total_intervensi_pending = query_int.filter(Intervensi.status=='pending').count()
    
    return {
        "total_mahasiswa": total_mhs,
        "tinggi": tinggi,
        "sedang": sedang,
        "rendah": rendah,
        "pct_tinggi": (tinggi / total_mhs * 100) if total_mhs > 0 else 0,
        "pct_sedang": (sedang / total_mhs * 100) if total_mhs > 0 else 0,
        "pct_rendah": (rendah / total_mhs * 100) if total_mhs > 0 else 0,
        "total_intervensi_pending": total_intervensi_pending
    }

@router.get("/risiko-per-angkatan")
async def risiko_per_angkatan(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == 'mahasiswa':
        raise HTTPException(status_code=403, detail="Akses ditolak")

    # Group by angkatan and risk_level
    subquery = db.query(
        PrediksiRisiko.mahasiswa_id, 
        func.max(PrediksiRisiko.created_at).label('max_date')
    ).group_by(PrediksiRisiko.mahasiswa_id).subquery()
    
    results = db.query(Mahasiswa.angkatan, PrediksiRisiko.risk_level, func.count(Mahasiswa.id))\
        .join(PrediksiRisiko, Mahasiswa.id == PrediksiRisiko.mahasiswa_id)\
        .join(subquery, (PrediksiRisiko.mahasiswa_id == subquery.c.mahasiswa_id) & (PrediksiRisiko.created_at == subquery.c.max_date))\
        .group_by(Mahasiswa.angkatan, PrediksiRisiko.risk_level).all()
        
    data = {}
    for r in results:
        angkatan, level, count = r
        if angkatan not in data:
            data[angkatan] = {"angkatan": angkatan, "tinggi": 0, "sedang": 0, "rendah": 0}
        data[angkatan][level] = count
        
    return sorted(list(data.values()), key=lambda x: x['angkatan'])

@router.get("/tren-ip")
async def tren_ip(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role == 'mahasiswa':
        raise HTTPException(status_code=403, detail="Akses ditolak")

    results = db.query(AkademikSemester.semester, func.avg(AkademikSemester.ip_semester))\
        .group_by(AkademikSemester.semester).order_by(AkademikSemester.semester).all()
        
    return [{"semester": r[0], "avg_ip": float(r[1])} for r in results]
