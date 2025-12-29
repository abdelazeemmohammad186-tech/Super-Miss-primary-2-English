
import React from 'react';

interface ModelInfoModalProps {
  onClose: () => void;
}

const ModelInfoModal: React.FC<ModelInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-slide-up">
        <div className="relative h-48 bg-gradient-to-b from-blue-600/20 to-transparent flex items-center justify-center">
          <div className="absolute top-6 right-6">
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <i className="fa-solid fa-circle-xmark text-2xl"></i>
            </button>
          </div>
          
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 blur-2xl absolute inset-0 animate-pulse"></div>
            <div className="w-24 h-24 rounded-full border-2 border-blue-400 flex items-center justify-center relative z-10 animate-spin-slow">
              <i className="fa-solid fa-atom text-4xl text-blue-400"></i>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-black animate-bounce">
              AI
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 text-center">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Mr. Gemini 3 Flash</h2>
          <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs mb-6">The Brain Behind Super Miss</p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
              <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">IQ Level</p>
              <p className="text-xl font-black text-white">MAX</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
              <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">Speed</p>
              <p className="text-xl font-black text-blue-400">FLASH</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
              <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">Mood</p>
              <p className="text-xl font-black text-green-400">HAPPY</p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <i className="fa-solid fa-shield-halved text-blue-500 mt-1"></i>
              <div>
                <p className="text-white font-bold text-sm">Protection Protocol</p>
                <p className="text-slate-400 text-xs">Super Miss is always respectful, kind, and professional.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
              <i className="fa-solid fa-brain text-purple-500 mt-1"></i>
              <div>
                <p className="text-white font-bold text-sm">Neural Teaching</p>
                <p className="text-slate-400 text-xs">I help Super Miss understand exactly what you need!</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-8 w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-95"
          >
            BACK TO CLASS! 🏫
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelInfoModal;
