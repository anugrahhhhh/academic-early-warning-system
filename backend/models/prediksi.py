from sqlalchemy import Column, Integer, String, Enum, Float, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from config.database import Base

class PrediksiRisiko(Base):
    __tablename__ = "prediksi_risiko"

    id = Column(Integer, primary_key=True, index=True)
    mahasiswa_id = Column(Integer, ForeignKey("mahasiswa.id"))
    semester = Column(Integer, nullable=False)
    tahun_akademik = Column(String(10), nullable=False)
    risk_level = Column(Enum('rendah', 'sedang', 'tinggi'), nullable=False)
    risk_score = Column(Float, nullable=False)
    algoritma_used = Column(String(50))
    rekomendasi_intervensi = Column(String(1000))
    created_at = Column(TIMESTAMP, server_default=func.now())

    mahasiswa = relationship("Mahasiswa", back_populates="prediksi")
