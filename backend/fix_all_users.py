import bcrypt
# Fix compatibility
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

from config.database import SessionLocal
from models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

print("Sedang memproses seluruh user di database...")
users = db.query(User).all()
count = 0

for user in users:
    user.password_hash = pwd_context.hash("password123")
    count += 1

db.commit()
db.close()

print(f"Selesai! {count} user telah diperbarui passwordnya menjadi: password123")
