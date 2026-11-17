from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from config.database import get_db
from models.mahasiswa import Mahasiswa
from models.akademik import AkademikSemester, Kehadiran, NilaiMatakuliah, AktivitasLMS, AktivitasPraktikum
from models.prediksi import PrediksiRisiko
from models.intervensi import Intervensi
from schemas.mahasiswa import MahasiswaResponse, EWSData
from routers.auth import get_current_user

router = APIRouter(prefix="/api/mahasiswa", tags=["mahasiswa"])

@router.get("/", response_model=List[dict])
async def list_mahasiswa(
    angkatan: Optional[int] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role == 'mahasiswa':
        raise HTTPException(status_code=403, detail="Akses ditolak: Mahasiswa tidak diperbolehkan melihat daftar mahasiswa lain.")
    
    query = db.query(Mahasiswa)

    # Filter untuk Dosen PA
    if current_user.role == 'dosen_pa':
        query = query.filter(Mahasiswa.dosen_pa_id == current_user.id)
    
    if angkatan:
        query = query.filter(Mahasiswa.angkatan == angkatan)
    
    if search:
        query = query.filter((Mahasiswa.nim.contains(search)) | (Mahasiswa.nama.contains(search)))
        
    if risk_level:
        query = query.join(PrediksiRisiko).filter(PrediksiRisiko.risk_level == risk_level)

    total = query.count()
    offset = (page - 1) * limit
    mahasiswas = query.offset(offset).limit(limit).all()
    
    result = []
    for m in mahasiswas:
        # Get latest risk
        prediksi = db.query(PrediksiRisiko).filter_by(mahasiswa_id=m.id).order_by(PrediksiRisiko.created_at.desc()).first()
        # Get latest IPK
        akademik = db.query(AkademikSemester).filter_by(mahasiswa_id=m.id).order_by(AkademikSemester.semester.desc()).first()
        
        result.append({
            "id": m.id,
            "nim": m.nim,
            "nama": m.nama,
            "angkatan": m.angkatan,
            "status_aktif": m.status_aktif,
            "risk_level": prediksi.risk_level if prediksi else "n/a",
            "ip_kumulatif": float(akademik.ip_kumulatif) if akademik else 0.0
        })
        
    return result

@router.get("/{nim}", response_model=dict)
async def get_mahasiswa_detail(nim: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    m = db.query(Mahasiswa).filter_by(nim=nim).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")

    # Cek akses mahasiswa
    if current_user.role == 'mahasiswa':
        if m.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak: Anda hanya dapat melihat data Anda sendiri.")
    
    # Cek akses Dosen PA
    if current_user.role == 'dosen_pa':
        if m.dosen_pa_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak: Mahasiswa ini bukan bimbingan Anda.")

    return m

@router.get("/{nim}/akademik", response_model=dict)
async def get_akademik_history(nim: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    m = db.query(Mahasiswa).filter_by(nim=nim).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")

    # Cek akses
    if current_user.role == 'mahasiswa' and m.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if current_user.role == 'dosen_pa' and m.dosen_pa_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    akademik = db.query(AkademikSemester).filter_by(mahasiswa_id=m.id).all()
    nilai = db.query(NilaiMatakuliah).filter_by(mahasiswa_id=m.id).all()
    kehadiran = db.query(Kehadiran).filter_by(mahasiswa_id=m.id).all()
    
    return {
        "akademik": akademik,
        "nilai": nilai,
        "kehadiran": kehadiran
    }

@router.get("/{nim}/early-warning", response_model=EWSData)
async def get_ews_data(nim: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    m = db.query(Mahasiswa).filter_by(nim=nim).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")

    # Cek akses
    if current_user.role == 'mahasiswa' and m.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if current_user.role == 'dosen_pa' and m.dosen_pa_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    prediksi = db.query(PrediksiRisiko).filter_by(mahasiswa_id=m.id).order_by(PrediksiRisiko.created_at.desc()).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")
        
    prediksi = db.query(PrediksiRisiko).filter_by(mahasiswa_id=m.id).order_by(PrediksiRisiko.created_at.desc()).first()
    if not prediksi:
        raise HTTPException(status_code=404, detail="No EWS data for this student")
        
    # Get latest features for radar chart
    latest_sem = prediksi.semester
    ak = db.query(AkademikSemester).filter_by(mahasiswa_id=m.id, semester=latest_sem).first()
    lms = db.query(AktivitasLMS).filter_by(mahasiswa_id=m.id, semester=latest_sem).first()
    kehadiran = db.query(Kehadiran).filter_by(mahasiswa_id=m.id, semester=latest_sem).all()
    prak = db.query(AktivitasPraktikum).filter_by(mahasiswa_id=m.id, semester=latest_sem).all()
    
    avg_pres = sum(k.persentase_kehadiran for k in kehadiran) / len(kehadiran) if kehadiran else 0
    avg_prak = sum(p.nilai_praktikum for p in prak) / len(prak) if prak else 0
    
    # Trend IP
    history = db.query(AkademikSemester).filter_by(mahasiswa_id=m.id).order_by(AkademikSemester.semester.asc()).all()
    ip_trend = [{"semester": h.semester, "ip_semester": float(h.ip_semester), "ip_kumulatif": float(h.ip_kumulatif)} for h in history]
    
    # Courses to repeat
    mk_ulang = db.query(NilaiMatakuliah.kode_mk, NilaiMatakuliah.nama_mk, db.func.count(NilaiMatakuliah.id).label('count_ulang'))\
        .filter(NilaiMatakuliah.mahasiswa_id == m.id)\
        .filter(NilaiMatakuliah.nilai_huruf.in_(['D', 'E']))\
        .group_by(NilaiMatakuliah.kode_mk, NilaiMatakuliah.nama_mk).all()
        
    intervensi = db.query(Intervensi).filter_by(mahasiswa_id=m.id).all()
    
    return {
        "nim": m.nim,
        "nama": m.nama,
        "angkatan": m.angkatan,
        "risk_level": prediksi.risk_level,
        "risk_score": prediksi.risk_score,
        "rekomendasi_intervensi": prediksi.rekomendasi_intervensi,
        "radar_data": {
            "ip": float(ak.ip_semester) / 4 * 100 if ak else 0,
            "kehadiran": float(avg_pres),
            "lms": float(lms.jumlah_login) / 100 * 100 if lms else 0, # Normalized
            "tugas": float(lms.jumlah_tugas_submit) / 10 * 100 if lms else 0, # Normalized
            "praktikum": float(avg_prak) / 4 * 100
        },
        "ip_trend": ip_trend,
        "mk_ulang": [{"kode_mk": mku[0], "nama_mk": mku[1], "count_ulang": mku[2]} for mku in mk_ulang],
        "history_intervensi": [i.__dict__ for i in intervensi]
    }
