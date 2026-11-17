from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io

from config.database import get_db
from models.mahasiswa import Mahasiswa
from models.akademik import AkademikSemester, Kehadiran, NilaiMatakuliah
from routers.auth import get_current_user

router = APIRouter(prefix="/api/import", tags=["import"])

@router.post("/akademik")
async def import_akademik(file: UploadFile = File(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    count = 0
    for _, row in df.iterrows():
        m = db.query(Mahasiswa).filter_by(nim=str(row['nim'])).first()
        if m:
            new_ak = AkademikSemester(
                mahasiswa_id=m.id,
                semester=int(row['semester']),
                ip_semester=float(row['ip_semester']),
                ip_kumulatif=float(row['ip_kumulatif']),
                total_sks=int(row['total_sks']),
                sks_diambil=int(row['sks_diambil']),
                tahun_akademik=str(row['tahun_akademik'])
            )
            db.add(new_ak)
            count += 1
            
    db.commit()
    return {"message": f"Successfully imported {count} academic records"}

@router.post("/kehadiran")
async def import_kehadiran(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Similar logic for kehadiran
    return {"message": "Not implemented in this demo, but logic is same as akademik"}

@router.post("/nilai")
async def import_nilai(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Similar logic for nilai
    return {"message": "Not implemented in this demo, but logic is same as akademik"}
