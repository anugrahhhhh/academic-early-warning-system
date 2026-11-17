import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Target, ListFilter, AlertCircle } from 'lucide-react';

const ConfusionMatrix = ({ matrix, labels }) => {
  const max = Math.max(...matrix.flat());
  
  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-4 gap-1 w-full max-w-sm">
        <div className="h-10"></div>
        {labels.map(l => <div key={l} className="text-xs font-bold text-center capitalize">{l}</div>)}
        
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            <div className="text-xs font-bold flex items-center capitalize">{labels[i]}</div>
            {row.map((val, j) => (
              <div 
                key={j} 
                className="h-20 flex flex-col items-center justify-center rounded text-sm font-bold border border-white"
                style={{ backgroundColor: `rgba(37, 99, 235, ${val/max * 0.8 + 0.1})`, color: val/max > 0.5 ? 'white' : 'black' }}
              >
                {val}
                <span className="text-[10px] opacity-60 font-normal">{(val/row.reduce((a,b)=>a+b,0)*100).toFixed(0)}%</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-gray-500">
        <div className="flex items-center"><div className="w-3 h-3 bg-primary-100 mr-1"></div> Rendah</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-primary-600 mr-1"></div> Tinggi</div>
      </div>
    </div>
  );
};

const MLEvaluationPage = () => {
  const [importance, setImportance] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [selectedModel, setSelectedModel] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [impRes, evalRes] = await Promise.all([
          api.get('/api/ml/feature-importance'),
          api.get('/api/ml/evaluation')
        ]);
        setImportance(impRes.data);
        setEvaluation(evalRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const labels = ['rendah', 'sedang', 'tinggi'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evaluasi Mendalam</h1>
        <p className="text-gray-500">Analisis metrik performa dan interpretasi model</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <Target className="mr-2 text-primary-600" />
            Confusion Matrix
          </h3>
          
          {evaluation ? (
            <div className="space-y-8">
              <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
                {evaluation.comparison.map((m, idx) => (
                  <button
                    key={m.model}
                    onClick={() => setSelectedModel(idx)}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectedModel === idx ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {m.model}
                  </button>
                ))}
              </div>
              
              <ConfusionMatrix 
                matrix={evaluation.comparison[selectedModel].confusion_matrix} 
                labels={labels} 
              />
              
              <div className="grid grid-cols-3 gap-4">
                 <div className="text-center">
                    <p className="text-xs text-gray-500">Precision</p>
                    <p className="font-bold text-lg">{(evaluation.comparison[selectedModel].precision * 100).toFixed(1)}%</p>
                 </div>
                 <div className="text-center">
                    <p className="text-xs text-gray-500">Recall</p>
                    <p className="font-bold text-lg">{(evaluation.comparison[selectedModel].recall * 100).toFixed(1)}%</p>
                 </div>
                 <div className="text-center">
                    <p className="text-xs text-gray-500">F1-Score</p>
                    <p className="font-bold text-lg">{(evaluation.comparison[selectedModel].f1 * 100).toFixed(1)}%</p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">Belum ada data evaluasi.</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <ListFilter className="mr-2 text-primary-600" />
            Kepentingan Fitur (Importance)
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importance} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="feature" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {importance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#2563eb' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl flex">
            <AlertCircle size={20} className="text-blue-600 mr-3 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Tiga fitur teratas (berwarna biru) memiliki pengaruh paling signifikan terhadap prediksi risiko mahasiswa. 
              <strong> {importance[0]?.feature.replace('_', ' ')}</strong> adalah indikator terkuat saat ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLEvaluationPage;
