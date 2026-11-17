from sqlalchemy import Column, Integer, String, Enum, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from config.database import Base

class Intervensi(Base):
    __tablename__ = "intervensi"

    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    dosen_id = Column(Integer, ForeignKey("users.id"))
    jenis_intervensi = Column(Enum('konsultasi_pa', 'remedial', 'mentoring', 'monitoring_rutin'), nullable=False)
    catatan = Column(Text)
    tanggal = Column(Date, nullable=False)
    status = Column(Enum('pending', 'ongoing', 'selesai'), default='pending')

    mahasiswa = relationship("Mahasiswa", back_populates="intervensi")
    dosen = relationship("User")
