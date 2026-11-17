from config.database import SessionLocal
from models.user import User
from passlib.context import CryptContext
import bcrypt

# Fix passlib/bcrypt compatibility issue
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

admin_email = "admin@unp.ac.id"
user = db.query(User).filter(User.email == admin_email).first()

if not user:
    print("Menambahkan user admin...")
    new_admin = User(
        name="Administrator",
        email=admin_email,
        password_hash=pwd_context.hash("password123"),
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    print("Admin berhasil ditambahkan!")
else:
    print("User admin sudah ada, mengupdate password...")
    user.password_hash = pwd_context.hash("password123")
    db.commit()
    print("Password admin berhasil direset!")
db.close()
