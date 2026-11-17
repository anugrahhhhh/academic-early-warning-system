import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Users, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import RiskBadge from '../components/ui/RiskBadge';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon, color, pct }) => (
  <div className="card p-6 flex items-center">
    <div className={`p-3 rounded-xl ${color} text-white mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <div className="flex items-baseline">
        <h3 className="text-2xl font-bold">{value}</h3>
        {pct !== undefined && (
          <span className="ml-2 text-xs font-semibold text-gray-400">({pct.toFixed(1)}%)</span>
        )}
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [risikoPerAngkatan, setRisikoPerAngkatan] = useState([]);
  const [trenIP, setTrenIP] = useState([]);
  const [latestRisk, setLatestRisk] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, risRes, trenRes, latRes] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/dashboard/risiko-per-angkatan'),
          api.get('/api/dashboard/tren-ip'),
          api.get(`/api/mahasiswa/?risk_level=tinggi&limit=5`)
        ]);
        setSummary(sumRes.data);
        setRisikoPerAngkatan(risRes.data);
        setTrenIP(trenRes.data);
        setLatestRisk(latRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };
    fetchData();
  }, []);

  const pieData = summary ? [
    { name: 'Tinggi', value: summary.tinggi, color: '#ef4444' },
    { name: 'Sedang', value: summary.sedang, color: '#f59e0b' },
    { name: 'Rendah', value: summary.rendah, color: '#10b981' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Dashboard Administrator' : 'Dashboard Dosen Pembimbing'}
          </h1>
          <p className="text-gray-500">
            {user?.role === 'admin' 
              ? 'Ringkasan status akademik seluruh Informatika UNP' 
              : 'Ringkasan status akademik mahasiswa bimbingan Anda'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Tahun Akademik</p>
          <p className="text-lg font-bold text-primary-600">2023/2024 Ganjil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={user?.role === 'admin' ? 'Total Mahasiswa' : 'Mahasiswa Bimbingan'} 
          value={summary?.total_mahasiswa || 0} 
          icon={<Users size={24} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Risiko Tinggi" 
          value={summary?.tinggi || 0} 
          pct={summary?.pct_tinggi}
          icon={<AlertTriangle size={24} />} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Risiko Sedang" 
          value={summary?.sedang || 0} 
          pct={summary?.pct_sedang}
          icon={<Info size={24} />} 
          color="bg-yellow-500" 
        />
        <StatCard 
          title="Risiko Rendah" 
          value={summary?.rendah || 0} 
          pct={summary?.pct_rendah}
          icon={<CheckCircle size={24} />} 
          color="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6">Distribusi Risiko per Angkatan</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={risikoPerAngkatan}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="angkatan" />
                <YAxis />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Legend />
                <Bar dataKey="tinggi" fill="#ef4444" name="Tinggi" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sedang" fill="#f59e0b" name="Sedang" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rendah" fill="#10b981" name="Rendah" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6">Tren IP Rata-rata per Semester</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trenIP}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semester" label={{ value: 'Semester', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Line type="monotone" dataKey="avg_ip" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="IP Rata-rata" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-6 self-start">Proporsi Risiko</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Mahasiswa Risiko Tinggi Terbaru</h3>
            <button className="text-primary-600 text-sm font-semibold hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 font-semibold text-gray-500 text-sm">NIM</th>
                  <th className="pb-3 font-semibold text-gray-500 text-sm">Nama</th>
                  <th className="pb-3 font-semibold text-gray-500 text-sm">Angkatan</th>
                  <th className="pb-3 font-semibold text-gray-500 text-sm">IPK</th>
                  <th className="pb-3 font-semibold text-gray-500 text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {latestRisk.map((m) => (
                  <tr key={m.nim} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm font-medium">{m.nim}</td>
                    <td className="py-4 text-sm font-medium">{m.nama}</td>
                    <td className="py-4 text-sm text-gray-500">{m.angkatan}</td>
                    <td className="py-4 text-sm font-bold text-red-600">{m.ip_kumulatif.toFixed(2)}</td>
                    <td className="py-4"><RiskBadge level="tinggi" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
