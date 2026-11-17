import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const RiskBadge = ({ level }) => {
  const configs = {
    tinggi: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertTriangle size={14} className="mr-1" />,
      label: 'Risiko Tinggi'
    },
    sedang: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Info size={14} className="mr-1" />,
      label: 'Risiko Sedang'
    },
    rendah: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle size={14} className="mr-1" />,
      label: 'Risiko Rendah'
    }
  };

  const config = configs[level.toLowerCase()] || configs.rendah;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export default RiskBadge;
