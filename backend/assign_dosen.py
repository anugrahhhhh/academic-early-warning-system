import random
import bcrypt
# Fix compatibility
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

from config.database import SessionLocal
from models.user import User
from models.mahasiswa import Mahasiswa
from models.akademik import AkademikSemester, Kehadiran, NilaiMatakuliah, AktivitasLMS, AktivitasPraktikum
from models.prediksi import PrediksiRisiko
from models.intervensi import Intervensi

db = SessionLocal()

# Dapatkan semua dosen_pa
dosen_ids = [u.id for u in db.query(User).filter_by(role='dosen_pa').all()]

if not dosen_ids:
    print("Error: Tidak ada user dengan role dosen_pa ditemukan.")
else:
    students = db.query(Mahasiswa).all()
    print(f"Menetapkan {len(students)} mahasiswa ke {len(dosen_ids)} dosen PA...")
    
    for s in students:
        s.dosen_pa_id = random.choice(dosen_ids)
        
    db.commit()
    print("Berhasil memperbarui relasi Dosen PA!")

db.close()
