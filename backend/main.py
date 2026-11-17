from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import bcrypt

# Fix passlib/bcrypt compatibility issue
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

from config.database import engine, Base
import models.user, models.mahasiswa, models.akademik, models.prediksi, models.intervensi
from routers import auth, mahasiswa, ml, intervensi as intervensi_router, dashboard, import_data

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Academic Early Warning System API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(mahasiswa.router)
app.include_router(ml.router)
app.include_router(intervensi_router.router)
app.include_router(dashboard.router)
app.include_router(import_data.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Academic EWS API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
