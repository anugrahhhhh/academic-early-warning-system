import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  User, BookOpen, AlertCircle, History, MessageSquare, Plus,
  Calendar, CheckCircle2, Clock
} from 'lucide-react';
import RiskBadge from '../components/ui/RiskBadge';
import RiskProgressBar from '../components/ui/RiskProgressBar';
import { toast } from 'react-hot-toast';

const MahasiswaDetailPage = () => {
  const { nim } = useParams();
  const [activeTab, setActiveTab] = useState('ews');
  const [data, setData] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newIntervention, setNewIntervention] = useState({
    jenis_intervensi: 'konsultasi_pa',
    catatan: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [ewsRes, acadRes] = await Promise.all([
          api.get(`/api/mahasiswa/${nim}/early-warning`),
          api.get(`/api/mahasiswa/${nim}/akademik`)
        ]);
        setData(ewsRes.data);
        setAcademic(acadRes.data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data mahasiswa");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [nim]);

  const handleAddIntervention = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/intervensi/', { ...newIntervention, nim });
      toast.success("Intervensi berhasil ditambahkan");
      setShowModal(false);
      // Refresh data
      const ewsRes = await api.get(`/api/mahasiswa/${nim}/early-warning`);
      setData(ewsRes.data);
    } catch (error) {
      toast.error("Gagal menambahkan intervensi");
    }
  };

  if (loading) return <div className="p-10 text-center">Memuat detail...</div>;
  if (!data) return <div className="p-10 text-center">Data tidak ditemukan</div>;

  const radarData = [
    { subject: 'IPK', A: data.radar_data.ip, fullMark: 100 },
    { subject: 'Hadir', A: data.radar_data.kehadiran, fullMark: 100 },
    { subject: 'LMS', A: data.radar_data.lms, fullMark: 100 },
    { subject: 'Tugas', A: data.radar_data.tugas, fullMark: 100 },
    { subject: 'Prak', A: data.radar_data.praktikum, fullMark: 100 },
  ];

  const rekom = JSON.parse(data.rekomendasi_intervensi);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6 border-l-4 border-primary-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
              {data.nama.charAt(0)}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{data.nama}</h1>
              <p className="text-gray-500 font-medium">{data.nim} • Angkatan {data.angkatan}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskBadge level={data.risk_level} />
            <div className="w-48">
              <p className="text-xs text-gray-500 mb-1 flex justify-between">
                Risk Score <span>{data.risk_score.toFixed(1)}%</span>
              </p>
              <RiskProgressBar score={data.risk_score} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('ews')}
          className={`px-6 py-3 font-medium text-sm transition-all ${activeTab === 'ews' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Early Warning Analysis
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium text-sm transition-all ${activeTab === 'history' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Riwayat Akademik
        </button>
        <button 
          onClick={() => setActiveTab('intervention')}
          className={`px-6 py-3 font-medium text-sm transition-all ${activeTab === 'intervention' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Intervensi & Monitoring
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'ews' && (
          <>
            <div className="lg:col-span-1 card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <AlertCircle className="mr-2 text-primary-600" size={20} />
                Radar Performa
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Performa"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 text-center italic">Perbandingan performa terhadap standar kelulusan minimal</p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-6">Tren Indeks Prestasi</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.ip_trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="semester" />
                      <YAxis domain={[0, 4]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ip_semester" stroke="#3b82f6" name="IP Semester" strokeWidth={2} />
                      <Line type="monotone" dataKey="ip_kumulatif" stroke="#10b981" name="IP Kumulatif" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`card p-6 border-l-4 ${data.risk_level === 'tinggi' ? 'border-red-500 bg-red-50' : data.risk_level === 'sedang' ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'}`}>
                <h3 className="text-lg font-bold mb-4">Rekomendasi Intervensi</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">Tindakan yang Disarankan:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {rekom.actions.map((act, i) => (
                        <li key={i} className="text-sm text-gray-600">{act}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500">Urgency</p>
                      <p className="text-sm font-bold text-red-600">{rekom.urgency}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-500">Follow-up</p>
                      <p className="text-sm font-bold text-primary-600">{rekom.follow_up}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="lg:col-span-3 card">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">Riwayat Nilai & Kehadiran</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-sm">Sem</th>
                      <th className="px-6 py-4 font-semibold text-sm">Kode MK</th>
                      <th className="px-6 py-4 font-semibold text-sm">Nama Mata Kuliah</th>
                      <th className="px-6 py-4 font-semibold text-sm">Nilai</th>
                      <th className="px-6 py-4 font-semibold text-sm">Hadir (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {academic.nilai.map((n, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm">{n.semester}</td>
                        <td className="px-6 py-4 text-sm font-medium">{n.kode_mk}</td>
                        <td className="px-6 py-4 text-sm">{n.nama_mk}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-bold ${['D', 'E'].includes(n.nilai_huruf) ? 'text-red-600' : 'text-gray-900'}`}>
                            {n.nilai_huruf} ({n.nilai_angka})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {academic.kehadiran.find(k => k.semester === n.semester)?.persentase_kehadiran || '-'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'intervention' && (
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Tambah Catatan Intervensi
              </button>
            </div>

            <div className="space-y-4">
              {data.history_intervensi.length > 0 ? (
                data.history_intervensi.map((int, i) => (
                  <div key={i} className="card p-6 border-l-4 border-primary-400">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-lg mr-4">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 capitalize">{int.jenis_intervensi.replace('_', ' ')}</h4>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar size={12} className="mr-1" />
                            {new Date(int.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        int.status === 'selesai' ? 'bg-green-100 text-green-700' : 
                        int.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {int.status}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                      "{int.catatan}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Belum ada riwayat intervensi untuk mahasiswa ini.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">Catat Intervensi Baru</h3>
            </div>
            <form onSubmit={handleAddIntervention} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Intervensi</label>
                <select 
                  className="input-field"
                  value={newIntervention.jenis_intervensi}
                  onChange={(e) => setNewIntervention({...newIntervention, jenis_intervensi: e.target.value})}
                >
                  <option value="konsultasi_pa">Konsultasi Dosen PA</option>
                  <option value="remedial">Program Remedial</option>
                  <option value="mentoring">Peer Mentoring</option>
                  <option value="monitoring_rutin">Monitoring Rutin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newIntervention.tanggal}
                  onChange={(e) => setNewIntervention({...newIntervention, tanggal: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan & Hasil</label>
                <textarea 
                  rows={4} 
                  className="input-field" 
                  placeholder="Masukkan detail hasil pertemuan atau rencana tindak lanjut..."
                  value={newIntervention.catatan}
                  onChange={(e) => setNewIntervention({...newIntervention, catatan: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">Simpan Intervensi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MahasiswaDetailPage;
