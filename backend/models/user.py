from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func
from config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('admin', 'dosen_pa', 'mahasiswa'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
