import React, { useState } from 'react';
import api from '../services/api';
import { BrainCircuit, Play, CheckCircle2, Crown, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MLTrainingPage = () => {
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState(null);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await api.post('/api/ml/train');
      setResults(res.data);
      toast.success("Model berhasil dilatih!");
    } catch (error) {
      toast.error("Gagal melatih model");
    } finally {
      setTraining(false);
    }
  };

  const handlePredictAll = async () => {
    try {
      const res = await api.post('/api/ml/predict-all');
      toast.success(`Berhasil memprediksi ${res.data.total} mahasiswa!`);
    } catch (error) {
      toast.error("Gagal menjalankan prediksi batch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machine Learning Training</h1>
          <p className="text-gray-500">Eksperimen dan optimalisasi algoritma prediksi risiko</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-8 lg:col-span-1 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <BrainCircuit size={48} className="mb-6 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">Pipeline Pelatihan</h2>
          <p className="text-primary-100 mb-8 leading-relaxed">
            Menjalankan pipeline lengkap termasuk rekayasa fitur, penanganan data tidak seimbang (SMOTE), 
            dan evaluasi 5 algoritma berbeda secara simultan.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleTrain}
              disabled={training}
              className="w-full flex items-center justify-center py-4 bg-white text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-all disabled:opacity-50"
            >
              {training ? <Loader2 className="animate-spin mr-2" /> : <Play size={20} className="mr-2" />}
              {training ? 'Melatih Model...' : 'Mulai Training Sekarang'}
            </button>
            {results && (
              <button
                onClick={handlePredictAll}
                className="w-full flex items-center justify-center py-4 bg-primary-700 text-white border border-primary-500 rounded-xl font-bold hover:bg-primary-600 transition-all"
              >
                Terapkan ke Semua Mahasiswa
              </button>
            )}
          </div>
        </div>

        <div className="card p-0 lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold">Hasil Perbandingan Algoritma</h3>
            {results && (
              <span className="flex items-center text-green-600 text-sm font-bold">
                <CheckCircle2 size={16} className="mr-1" />
                Selesai
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Algoritma</th>
                  <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">F1-Score</th>
                  <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">ROC AUC</th>
                  <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results ? results.comparison.map((res) => (
                  <tr key={res.model} className={res.is_best ? 'bg-primary-50/50' : ''}>
                    <td className="px-6 py-4 flex items-center">
                      <span className="font-bold text-gray-900">{res.model}</span>
                      {res.is_best && <Crown size={16} className="ml-2 text-yellow-500" fill="currentColor" />}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{(res.accuracy * 100).toFixed(2)}%</td>
                    <td className="px-6 py-4 font-mono text-sm">{(res.f1 * 100).toFixed(2)}%</td>
                    <td className="px-6 py-4 font-mono text-sm">{(res.auc * 100).toFixed(2)}%</td>
                    <td className="px-6 py-4">
                      {res.is_best ? (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-bold">TERBAIK</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                      Lakukan training untuk melihat perbandingan model
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {results && (
        <div className="card p-6 border-l-4 border-green-500 bg-green-50">
          <div className="flex">
            <div className="p-2 bg-green-100 text-green-700 rounded-lg mr-4 h-fit">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-green-800">Model Deployment Berhasil</h4>
              <p className="text-sm text-green-700 mt-1">
                Sistem telah memilih <strong>{results.best_model}</strong> sebagai model aktif karena memiliki F1-Score tertinggi 
                ({(results.best_f1 * 100).toFixed(2)}%). Model ini sekarang digunakan untuk seluruh prediksi real-time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLTrainingPage;
