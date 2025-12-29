
import React from 'react';
import { Unit } from '../types';

interface DashboardProps {
  units: Unit[];
  onSelectUnit: (unit: Unit) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ units, onSelectUnit }) => {
  return (
    <div className="space-y-8 animate-fade-in py-6">
      <div className="text-center space-y-2">
        <div className="inline-block bg-blue-100 text-blue-600 text-xs font-bold px-4 py-1 rounded-full mb-2">
          PRIMARY 2 • TERM 1
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Choose a Unit! 🌟</h2>
        <p className="text-slate-500">Pick a topic to start learning with Super Miss.</p>
        <p className="text-slate-400 text-xs font-semibold">منهج اللغة الإنجليزية للصف الثاني الابتدائي - الترم الأول</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {units.map((unit) => (
          <div 
            key={unit.id}
            onClick={() => onSelectUnit(unit)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 border-b-8 border-slate-100"
          >
            <div className={`h-24 ${unit.color} flex items-center justify-center text-white relative`}>
              <div className="absolute top-4 left-4 bg-white text-gray-800 font-bold px-3 py-1 rounded-full text-sm">
                UNIT {unit.id}
              </div>
              <span className="text-5xl opacity-80 group-hover:scale-125 transition-transform duration-500">
                {getUnitEmoji(unit.id)}
              </span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-1">{unit.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-1">{unit.subtitle}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {unit.vocabulary.slice(0, 4).map(v => (
                  <span key={v} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium">
                    {v}
                  </span>
                ))}
                {unit.vocabulary.length > 4 && (
                  <span className="text-slate-400 text-xs font-medium self-center">
                    +{unit.vocabulary.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getUnitEmoji(id: number) {
  switch (id) {
    case 1: return '🏫';
    case 2: return '🎨';
    case 3: return '📋';
    case 4: return '👨‍👩‍👧';
    case 5: return '🏠';
    case 6: return '🛋️';
    default: return '📚';
  }
}

export default Dashboard;
