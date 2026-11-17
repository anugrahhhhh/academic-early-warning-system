# Academic Early Warning System (EWS)

Sistem peringatan dini akademik untuk **Program Studi Informatika, Universitas Negeri Padang (UNP)**. Aplikasi ini memprediksi tingkat risiko akademik mahasiswa (**rendah / sedang / tinggi**) memakai *machine learning*, lalu membantu Dosen Pembimbing Akademik (PA) mencatat dan memantau intervensi.

Proyek ini dikembangkan sebagai bagian dari kegiatan pengabdian.

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Arsitektur & Struktur Folder](#arsitektur--struktur-folder)
- [Peran Pengguna](#peran-pengguna)
- [Cara Kerja Model Machine Learning](#cara-kerja-model-machine-learning)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Akun Demo](#akun-demo)
- [Dokumentasi API](#dokumentasi-api)
- [Skema Database](#skema-database)
- [Format Import CSV](#format-import-csv)
- [Script Utilitas](#script-utilitas)
- [Catatan & Pengembangan Lanjutan](#catatan--pengembangan-lanjutan)

---

## Fitur

- **Login berbasis JWT** dengan tiga peran: Admin, Dosen PA, dan Mahasiswa.
- **Dashboard ringkasan**: jumlah mahasiswa, sebaran risiko, risiko per angkatan, dan tren IP.
- **Daftar & detail mahasiswa**: riwayat akademik per semester, kehadiran, nilai, aktivitas LMS, dan praktikum.
- **Prediksi risiko akademik** per mahasiswa atau untuk semua mahasiswa sekaligus.
- **Pelatihan model ML** langsung dari aplikasi: 5 algoritma dibandingkan, model terbaik dipilih otomatis.
- **Evaluasi model**: accuracy, precision, recall, F1, ROC-AUC, confusion matrix, dan *feature importance*.
- **Rekomendasi intervensi** otomatis sesuai tingkat risiko.
- **Pencatatan intervensi** oleh Dosen PA (konsultasi PA, remedial, mentoring, monitoring rutin) beserta statusnya.
- **Import data akademik** dari file CSV.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS, React Router, TanStack Query, Recharts, Framer Motion, Axios |
| Backend | Python, FastAPI, SQLAlchemy 2, Pydantic 2, python-jose (JWT), passlib/bcrypt |
| Machine Learning | scikit-learn, XGBoost, imbalanced-learn (SMOTE), pandas, NumPy, joblib |
| Database | MySQL / MariaDB (driver PyMySQL) |

## Arsitektur & Struktur Folder

```
Browser (React, port 3000) ──/api──► FastAPI (port 8000) ──► MySQL (ews_db)
                                          │
                                          └── ml_models/ (model .pkl hasil training)
```

```
.
├── backend/
│   ├── main.py              # Entry point FastAPI, CORS, registrasi router
│   ├── config/database.py   # Koneksi SQLAlchemy (membaca DATABASE_URL dari .env)
│   ├── models/              # Model ORM: user, mahasiswa, akademik, prediksi, intervensi
│   ├── schemas/             # Skema Pydantic untuk request/response
│   ├── routers/             # Endpoint: auth, dashboard, mahasiswa, ml, intervensi, import_data
│   ├── services/
│   │   ├── ml_service.py    # Ekstraksi fitur, pelabelan, training, prediksi
│   │   └── ews_service.py   # Aturan rekomendasi intervensi
│   ├── assign_dosen.py      # Script: membagi mahasiswa ke Dosen PA
│   ├── fix_admin.py         # Script: membuat/mereset akun admin
│   ├── fix_all_users.py     # Script: mereset password semua user
│   ├── requirements.txt
│   └── .env.example
├── database/
│   ├── schema.sql           # DDL tabel
│   └── seeder.sql           # Data contoh (dummy)
└── frontend/
    ├── src/
    │   ├── pages/           # Login, Dashboard, Mahasiswa (list/detail), ML Training, ML Evaluation, Profile
    │   ├── components/      # Sidebar, RiskBadge, RiskProgressBar
    │   ├── context/         # AuthContext (state login)
    │   └── services/        # Axios instance + interceptor JWT
    ├── vite.config.js       # Dev server port 3000, proxy /api → localhost:8000
    └── package.json
```

## Peran Pengguna

| Peran | Akses |
|---|---|
| **Admin** | Dashboard seluruh mahasiswa, daftar & detail mahasiswa, training dan evaluasi model ML, import CSV, prediksi massal |
| **Dosen PA** | Dashboard & daftar khusus mahasiswa bimbingannya, detail mahasiswa, pencatatan intervensi |
| **Mahasiswa** | Halaman profil dan status risiko akademik dirinya sendiri |

## Cara Kerja Model Machine Learning

1. **Ekstraksi fitur** (`build_feature_matrix`) per mahasiswa per semester:
   IP semester, IPK, SKS diambil, rata-rata & minimum kehadiran, rata-rata nilai, jumlah MK bernilai D/E, jumlah MK ulang, aktivitas LMS (login, tugas dikumpulkan, tugas terlambat, skor LMS), nilai & kehadiran praktikum, semester ke-, dan tren IP terhadap semester sebelumnya.
2. **Pelabelan otomatis** (`auto_label`) berbasis aturan:
   - **Tinggi**: IPK < 2,00 **atau** kehadiran < 60% **atau** MK ulang ≥ 3 **atau** MK nilai D/E ≥ 4
   - **Sedang**: IPK ≤ 2,75 **atau** kehadiran ≤ 75% **atau** MK ulang 1–2
   - **Rendah**: selain kondisi di atas
3. **Pra-pemrosesan**: split data 80/20 (stratified), standarisasi (`StandardScaler`), dan penyeimbangan kelas dengan **SMOTE**.
4. **Training 5 algoritma**: Decision Tree, Random Forest, Naive Bayes, SVM (RBF), dan XGBoost, dengan 5-fold cross-validation.
5. **Pemilihan model** dengan F1-score tertinggi. Model, scaler, label encoder, dan daftar fitur disimpan ke `backend/ml_models/`.
6. **Prediksi** menghasilkan `risk_level`, `risk_score`, dan rekomendasi intervensi:

| Risiko | Rekomendasi | Urgensi | Tindak lanjut |
|---|---|---|---|
| Tinggi | Konsultasi wajib PA, remedial MK D/E, mentoring akademik, evaluasi beban SKS | Segera (≤ 1 minggu) | 2 minggu sekali |
| Sedang | Monitoring kehadiran, pantau tugas & LMS, konsultasi PA opsional | Perhatian (≤ 1 bulan) | 1 bulan sekali |
| Rendah | Tidak perlu intervensi khusus | Normal | Per semester |

## Instalasi & Menjalankan

### Prasyarat

- Python 3.10+
- Node.js 18+ dan npm
- MySQL 8 / MariaDB

### 1. Clone repository

```bash
git clone https://github.com/anugrahhhhh/academic-early-warning-system.git
cd academic-early-warning-system
```

### 2. Siapkan database

```bash
mysql -u root -p < database/schema.sql
```

Model `Mahasiswa` di backend memakai kolom `dosen_pa_id` yang belum ada di `schema.sql`, jadi tambahkan dulu:

```sql
USE ews_db;
ALTER TABLE mahasiswa ADD COLUMN dosen_pa_id INT NULL,
  ADD FOREIGN KEY (dosen_pa_id) REFERENCES users(id);
```

Lalu isi data contoh:

```bash
mysql -u root -p < database/seeder.sql
```

### 3. Jalankan backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # lalu sesuaikan isinya
```

Isi `backend/.env`:

| Variabel | Keterangan | Contoh |
|---|---|---|
| `DATABASE_URL` | URL koneksi SQLAlchemy | `mysql+pymysql://root:password@localhost:3306/ews_db` |
| `SECRET_KEY` | Kunci rahasia penandatanganan JWT | string acak panjang |
| `ALGORITHM` | Algoritma JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Masa berlaku token (menit) | `480` |

Siapkan akun dan relasi Dosen PA, lalu jalankan server:

```bash
python fix_all_users.py     # set password semua user menjadi password123
python assign_dosen.py      # bagikan mahasiswa ke Dosen PA secara acak
python main.py              # atau: uvicorn main:app --reload --port 8000
```

API berjalan di `http://localhost:8000`, dokumentasi interaktif di `http://localhost:8000/docs`.

### 4. Jalankan frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000`. Permintaan ke `/api` otomatis diteruskan ke backend lewat proxy Vite. Untuk backend di alamat lain, set `VITE_API_URL`.

### 5. Latih model

Login sebagai admin, buka menu **ML Training**, lalu jalankan training. Setelah itu jalankan **Predict All** agar setiap mahasiswa memiliki status risiko.

Build produksi frontend: `npm run build` (hasil di `frontend/dist/`).

## Akun Demo

Setelah menjalankan `fix_all_users.py`, semua akun memakai password **`password123`**.

| Peran | Email |
|---|---|
| Admin | `admin@unp.ac.id` |
| Dosen PA | `dosen1@unp.ac.id` … `dosen5@unp.ac.id` |
| Mahasiswa | `<NIM>@student.unp.ac.id`, contoh `23346001@student.unp.ac.id` |

> Ganti password ini sebelum aplikasi dipakai di luar lingkungan lokal.

## Dokumentasi API

Semua endpoint (kecuali login) membutuhkan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login, mengembalikan JWT |
| GET | `/api/auth/me` | Data user yang sedang login |
| GET | `/api/dashboard/summary` | Ringkasan jumlah mahasiswa, sebaran risiko, intervensi |
| GET | `/api/dashboard/risiko-per-angkatan` | Sebaran risiko per angkatan |
| GET | `/api/dashboard/tren-ip` | Tren rata-rata IP |
| GET | `/api/mahasiswa/` | Daftar mahasiswa (difilter sesuai peran) |
| GET | `/api/mahasiswa/{nim}` | Detail mahasiswa |
| GET | `/api/mahasiswa/{nim}/akademik` | Riwayat akademik lengkap |
| GET | `/api/mahasiswa/{nim}/early-warning` | Status risiko & rekomendasi |
| POST | `/api/ml/train` | Melatih ulang semua model |
| GET | `/api/ml/evaluation` | Metrik evaluasi model |
| POST | `/api/ml/predict/{nim}` | Prediksi risiko satu mahasiswa |
| POST | `/api/ml/predict-all` | Prediksi risiko semua mahasiswa |
| GET | `/api/ml/feature-importance` | Tingkat kepentingan fitur |
| GET | `/api/intervensi/{nim}` | Riwayat intervensi mahasiswa |
| POST | `/api/intervensi/` | Menambah intervensi |
| PUT | `/api/intervensi/{id}` | Memperbarui intervensi |
| POST | `/api/import/akademik` | Import CSV data akademik (admin) |
| POST | `/api/import/kehadiran` | Import CSV kehadiran (*belum diimplementasikan*) |
| POST | `/api/import/nilai` | Import CSV nilai (*belum diimplementasikan*) |

## Skema Database

| Tabel | Isi |
|---|---|
| `users` | Akun login (admin, dosen_pa, mahasiswa) |
| `mahasiswa` | NIM, nama, angkatan, status aktif, relasi ke user & Dosen PA |
| `akademik_semester` | IP semester, IPK, SKS per semester |
| `kehadiran` | Persentase kehadiran per mata kuliah |
| `nilai_matakuliah` | Nilai huruf/angka dan status mengulang |
| `aktivitas_lms` | Login, tugas dikumpulkan, tugas terlambat |
| `aktivitas_praktikum` | Nilai dan kehadiran praktikum |
| `prediksi_risiko` | Hasil prediksi, skor, algoritma, rekomendasi |
| `intervensi` | Catatan tindakan Dosen PA beserta statusnya |

Detail lengkap ada di [database/schema.sql](database/schema.sql).

## Format Import CSV

Endpoint `/api/import/akademik` menerima CSV dengan kolom:

```csv
nim,semester,ip_semester,ip_kumulatif,total_sks,sks_diambil,tahun_akademik
23346001,1,3.45,3.45,20,20,2023/2024
```

Baris dengan NIM yang belum terdaftar akan dilewati.

## Script Utilitas

Jalankan dari folder `backend/` setelah `.env` siap.

| Script | Fungsi |
|---|---|
| `fix_admin.py` | Membuat akun `admin@unp.ac.id` atau mereset passwordnya ke `password123` |
| `fix_all_users.py` | Mereset password semua user ke `password123` |
| `assign_dosen.py` | Membagikan setiap mahasiswa ke Dosen PA secara acak |

## Catatan & Pengembangan Lanjutan

- Data pada `seeder.sql` adalah **data dummy**, bukan data mahasiswa asli.
- Label risiko dibuat dengan aturan (*rule-based*), sehingga model mempelajari aturan tersebut. Untuk hasil yang lebih bermakna, gunakan label historis nyata (misalnya status DO/lulus tepat waktu).
- CORS saat ini mengizinkan semua origin (`allow_origins=["*"]`). Batasi ke URL frontend saat produksi.
- Import CSV untuk kehadiran dan nilai belum diimplementasikan.
- `SECRET_KEY` wajib diganti dan file `.env` tidak boleh di-commit.
