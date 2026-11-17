-- Academic Early Warning System (EWS) Database Schema
-- For Informatika Study Program, Universitas Negeri Padang (UNP)

CREATE DATABASE IF NOT EXISTS ews_db;
USE ews_db;

-- 1. Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'dosen_pa', 'mahasiswa') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Mahasiswa table
CREATE TABLE mahasiswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    angkatan YEAR NOT NULL,
    status_aktif ENUM('aktif', 'cuti', 'dropout', 'lulus') DEFAULT 'aktif',
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Akademik Semester table
CREATE TABLE akademik_semester (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 14),
    ip_semester DECIMAL(3,2) NOT NULL,
    ip_kumulatif DECIMAL(3,2) NOT NULL,
    total_sks INT NOT NULL,
    sks_diambil INT NOT NULL,
    tahun_akademik VARCHAR(10) NOT NULL,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- 4. Kehadiran table
CREATE TABLE kehadiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    semester INT NOT NULL,
    mata_kuliah VARCHAR(100) NOT NULL,
    persentase_kehadiran DECIMAL(5,2) NOT NULL,
    tahun_akademik VARCHAR(10) NOT NULL,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- 5. Nilai Matakuliah table
CREATE TABLE nilai_matakuliah (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    semester INT NOT NULL,
    kode_mk VARCHAR(10) NOT NULL,
    nama_mk VARCHAR(100) NOT NULL,
    nilai_huruf ENUM('A', 'B+', 'B', 'C+', 'C', 'D', 'E') NOT NULL,
    nilai_angka DECIMAL(3,2) NOT NULL,
    status_ulang BOOLEAN DEFAULT FALSE,
    tahun_akademik VARCHAR(10) NOT NULL,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- 6. Aktivitas LMS table
CREATE TABLE aktivitas_lms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    semester INT NOT NULL,
    jumlah_login INT DEFAULT 0,
    jumlah_tugas_submit INT DEFAULT 0,
    jumlah_tugas_terlambat INT DEFAULT 0,
    tahun_akademik VARCHAR(10) NOT NULL,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- 7. Aktivitas Praktikum table
CREATE TABLE aktivitas_praktikum (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    semester INT NOT NULL,
    nama_praktikum VARCHAR(100) NOT NULL,
    nilai_praktikum DECIMAL(3,2) NOT NULL,
    kehadiran_praktikum DECIMAL(5,2) NOT NULL,
    tahun_akademik VARCHAR(10) NOT NULL,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- 8. Prediksi Risiko table
CREATE TABLE prediksi_risiko (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    semester INT NOT NULL,
    tahun_akademik VARCHAR(10) NOT NULL,
    risk_level ENUM('rendah', 'sedang', 'tinggi') NOT NULL,
    risk_score FLOAT NOT NULL,
    algoritma_used VARCHAR(50),
    rekomendasi_intervensi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- 9. Intervensi table
CREATE TABLE intervensi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT NOT NULL,
    dosen_id INT NOT NULL,
    jenis_intervensi ENUM('konsultasi_pa', 'remedial', 'mentoring', 'monitoring_rutin') NOT NULL,
    catatan TEXT,
    tanggal DATE NOT NULL,
    status ENUM('pending', 'ongoing', 'selesai') DEFAULT 'pending',
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    FOREIGN KEY (dosen_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_mahasiswa_nim ON mahasiswa(nim);
CREATE INDEX idx_akademik_mhs_sem ON akademik_semester(mahasiswa_id, semester);
CREATE INDEX idx_kehadiran_mhs_sem ON kehadiran(mahasiswa_id, semester);
CREATE INDEX idx_nilai_mhs_sem ON nilai_matakuliah(mahasiswa_id, semester);
