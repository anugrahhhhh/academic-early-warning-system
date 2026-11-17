import React from 'react';

const RiskProgressBar = ({ score }) => {
  // 0-100 score
  const getProgressColor = (s) => {
    if (s >= 75) return 'bg-red-500';
    if (s >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(score)}`} 
        style={{ width: `${score}%` }}
      ></div>
    </div>
  );
};

export default RiskProgressBar;
