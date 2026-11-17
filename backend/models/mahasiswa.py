from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Mahasiswa(Base):
    __tablename__ = "mahasiswa"

    id = Column(Integer, primary_key=True, index=True)
    nim = Column(String(20), unique=True, index=True, nullable=False)
    nama = Column(String(100), nullable=False)
    angkatan = Column(Integer, nullable=False)
    status_aktif = Column(Enum('aktif', 'cuti', 'dropout', 'lulus'), default='aktif')
    user_id = Column(Integer, ForeignKey("users.id"))
    dosen_pa_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", foreign_keys=[user_id])
    dosen_pa = relationship("User", foreign_keys=[dosen_pa_id])
    akademik = relationship("AkademikSemester", back_populates="mahasiswa")
    kehadiran = relationship("Kehadiran", back_populates="mahasiswa")
    nilai = relationship("NilaiMatakuliah", back_populates="mahasiswa")
    lms = relationship("AktivitasLMS", back_populates="mahasiswa")
    praktikum = relationship("AktivitasPraktikum", back_populates="mahasiswa")
    prediksi = relationship("PrediksiRisiko", back_populates="mahasiswa")
    intervensi = relationship("Intervensi", back_populates="mahasiswa")
