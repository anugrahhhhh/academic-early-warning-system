from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from config.database import get_db
from models.intervensi import Intervensi
from models.mahasiswa import Mahasiswa
from schemas.intervensi import IntervensiCreate, IntervensiUpdate, IntervensiResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/api/intervensi", tags=["intervensi"])

@router.get("/{nim}", response_model=List[IntervensiResponse])
async def list_interventions(nim: str, db: Session = Depends(get_db)):
    m = db.query(Mahasiswa).filter_by(nim=nim).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")
    return db.query(Intervensi).filter_by(mahasiswa_id=m.id).all()

@router.post("/", response_model=IntervensiResponse)
async def create_intervention(
    data: IntervensiCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    if current_user.role != 'dosen_pa' and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only Dosen PA or Admin can create interventions")
        
    m = db.query(Mahasiswa).filter_by(nim=data.nim).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mahasiswa not found")
        
    new_int = Intervensi(
        mahasiswa_id=m.id,
        dosen_id=current_user.id,
        jenis_intervensi=data.jenis_intervensi,
        catatan=data.catatan,
        tanggal=data.tanggal,
        status="pending"
    )
    db.add(new_int)
    db.commit()
    db.refresh(new_int)
    return new_int

@router.put("/{id}", response_model=IntervensiResponse)
async def update_intervention(
    id: int, 
    data: IntervensiUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    inte = db.query(Intervensi).filter_by(id=id).first()
    if not inte:
        raise HTTPException(status_code=404, detail="Intervention not found")
        
    inte.status = data.status
    if data.catatan:
        inte.catatan = data.catatan
        
    db.commit()
    db.refresh(inte)
    return inte
