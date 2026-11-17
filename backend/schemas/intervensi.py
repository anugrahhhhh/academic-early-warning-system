from pydantic import BaseModel
from datetime import date
from typing import Optional

class IntervensiBase(BaseModel):
    mahasiswa_id: int
    jenis_intervensi: str
    catatan: Optional[str]
    tanggal: date
    status: str = "pending"

class IntervensiCreate(BaseModel):
    nim: str
    jenis_intervensi: str
    catatan: Optional[str]
    tanggal: date

class IntervensiUpdate(BaseModel):
    status: str
    catatan: Optional[str]

class IntervensiResponse(IntervensiBase):
    id: int
    dosen_id: int
    class Config:
        from_attributes = True
