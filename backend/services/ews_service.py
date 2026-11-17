def get_rekomendasi(risk_level: str):
    """
    Generate recommendations based on risk level.
    """
    if risk_level == 'tinggi':
        return {
            "actions": [
                "Konsultasi wajib dengan Dosen Pembimbing Akademik (PA)",
                "Ikuti program remedial untuk mata kuliah dengan nilai D/E",
                "Daftarkan ke program mentoring akademik",
                "Evaluasi ulang beban SKS semester berikutnya"
            ],
            "urgency": "SEGERA — dalam 1 minggu",
            "follow_up": "2 minggu sekali"
        }
    elif risk_level == 'sedang':
        return {
            "actions": [
                "Monitoring rutin kehadiran setiap 2 minggu",
                "Pantau progress tugas dan aktivitas LMS",
                "Konsultasi opsional dengan Dosen PA"
            ],
            "urgency": "PERHATIAN — dalam 1 bulan",
            "follow_up": "1 bulan sekali"
        }
    else:
        return {
            "actions": [
                "Tidak diperlukan intervensi khusus",
                "Pertahankan performa akademik saat ini"
            ],
            "urgency": "NORMAL",
            "follow_up": "Per semester"
        }
