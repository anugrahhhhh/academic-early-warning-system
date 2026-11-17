from sqlalchemy import Column, Integer, String, Enum, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class AkademikSemester(Base):
    __tablename__ = "akademik_semester"
    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    semester = Column(Integer, nullable=False)
    ip_semester = Column(Numeric(3, 2), nullable=False)
    ip_kumulatif = Column(Numeric(3, 2), nullable=False)
    total_sks = Column(Integer, nullable=False)
    sks_diambil = Column(Integer, nullable=False)
    tahun_akademik = Column(String(10), nullable=False)
    mahasiswa = relationship("Mahasiswa", back_populates="akademik")

class Kehadiran(Base):
    __tablename__ = "kehadiran"
    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    semester = Column(Integer, nullable=False)
    mata_kuliah = Column(String(100), nullable=False)
    persentase_kehadiran = Column(Numeric(5, 2), nullable=False)
    tahun_akademik = Column(String(10), nullable=False)
    mahasiswa = relationship("Mahasiswa", back_populates="kehadiran")

class NilaiMatakuliah(Base):
    __tablename__ = "nilai_matakuliah"
    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    semester = Column(Integer, nullable=False)
    kode_mk = Column(String(10), nullable=False)
    nama_mk = Column(String(100), nullable=False)
    nilai_huruf = Column(Enum('A', 'B+', 'B', 'C+', 'C', 'D', 'E'), nullable=False)
    nilai_angka = Column(Numeric(3, 2), nullable=False)
    status_ulang = Column(Boolean, default=False)
    tahun_akademik = Column(String(10), nullable=False)
    mahasiswa = relationship("Mahasiswa", back_populates="nilai")

class AktivitasLMS(Base):
    __tablename__ = "aktivitas_lms"
    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    semester = Column(Integer, nullable=False)
    jumlah_login = Column(Integer, default=0)
    jumlah_tugas_submit = Column(Integer, default=0)
    jumlah_tugas_terlambat = Column(Integer, default=0)
    tahun_akademik = Column(String(10), nullable=False)
    mahasiswa = relationship("Mahasiswa", back_populates="lms")

class AktivitasPraktikum(Base):
    __tablename__ = "aktivitas_praktikum"
    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    semester = Column(Integer, nullable=False)
    nama_praktikum = Column(String(100), nullable=False)
    nilai_praktikum = Column(Numeric(3, 2), nullable=False)
    kehadiran_praktikum = Column(Numeric(5, 2), nullable=False)
    tahun_akademik = Column(String(10), nullable=False)
    mahasiswa = relationship("Mahasiswa", back_populates="praktikum")
