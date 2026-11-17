from pydantic import BaseModel
from typing import List, Optional

class MahasiswaBase(BaseModel):
    nim: str
    nama: str
    angkatan: int
    status_aktif: str

class MahasiswaResponse(MahasiswaBase):
    id: int
    class Config:
        from_attributes = True

class AkademikHistory(BaseModel):
    semester: int
    ip_semester: float
    ip_kumulatif: float
    total_sks: int
    sks_diambil: int
    tahun_akademik: str

class KehadiranData(BaseModel):
    semester: int
    mata_kuliah: str
    persentase_kehadiran: float

class NilaiData(BaseModel):
    semester: int
    kode_mk: str
    nama_mk: str
    nilai_huruf: str
    nilai_angka: float
    status_ulang: bool

class EWSData(BaseModel):
    nim: str
    nama: str
    angkatan: int
    risk_level: str
    risk_score: float
    rekomendasi_intervensi: Optional[str]
    radar_data: dict
    ip_trend: List[dict]
    mk_ulang: List[dict]
    history_intervensi: List[dict]
