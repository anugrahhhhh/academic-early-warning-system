import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import RiskBadge from '../components/ui/RiskBadge';

const MahasiswaListPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ angkatan: '', risk_level: '' });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMahasiswa = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page,
          limit: 20,
          ...(search && { search }),
          ...(filters.angkatan && { angkatan: filters.angkatan }),
          ...(filters.risk_level && { risk_level: filters.risk_level })
        });
        const res = await api.get(`/api/mahasiswa/?${query}`);
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMahasiswa();
  }, [page, search, filters]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Mahasiswa</h1>
          <p className="text-gray-500">Pantau performa akademik seluruh mahasiswa</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari NIM atau Nama..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.angkatan}
              onChange={(e) => setFilters({ ...filters, angkatan: e.target.value })}
            >
              <option value="">Semua Angkatan</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
            </select>
            <select
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.risk_level}
              onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
            >
              <option value="">Semua Risiko</option>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm text-gray-500">NIM</th>
              <th className="px-6 py-4 font-semibold text-sm text-gray-500">Nama</th>
              <th className="px-6 py-4 font-semibold text-sm text-gray-500">Angkatan</th>
              <th className="px-6 py-4 font-semibold text-sm text-gray-500">IP Kumulatif</th>
              <th className="px-6 py-4 font-semibold text-sm text-gray-500">Level Risiko</th>
              <th className="px-6 py-4 font-semibold text-sm text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((m) => (
                <tr key={m.nim} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{m.nim}</td>
                  <td className="px-6 py-4 text-sm font-medium">{m.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.angkatan}</td>
                  <td className="px-6 py-4 text-sm font-bold">{m.ip_kumulatif.toFixed(2)}</td>
                  <td className="px-6 py-4"><RiskBadge level={m.risk_level} /></td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/mahasiswa/${m.nim}`)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Data tidak ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Menampilkan {data.length} mahasiswa</p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setPage(page + 1)}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MahasiswaListPage;
