
import React, { useState, useRef, useEffect } from 'react';
import { Unit, TeachingMode } from './types';
import { CURRICULUM, TEACHER_AVATAR } from './constants';
import Dashboard from './components/Dashboard';
import LessonView from './components/LessonView';
import ModelInfoModal from './components/ModelInfoModal';

const STABLE_AVATAR_KEY = 'superMiss_final_avatar'; 

const App: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [mode, setMode] = useState<TeachingMode>(TeachingMode.MIXED);
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('superMiss_userName') || "");
  const [isStarted, setIsStarted] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STABLE_AVATAR_KEY);
      return saved || TEACHER_AVATAR;
    } catch (e) {
      return TEACHER_AVATAR;
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('superMiss_userName', userName);
  }, [userName]);

  const compressAndSaveImage = (base64Str: string) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400; 
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setCustomAvatar(compressedBase64);
        try {
          localStorage.setItem(STABLE_AVATAR_KEY, compressedBase64);
        } catch (e) {
          console.error("Storage issue", e);
        }
      }
    };
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressAndSaveImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-[#f0f9ff] flex flex-col overflow-hidden font-fredoka">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarChange} 
        className="hidden" 
        accept="image/*" 
      />

      {!isStarted ? (
        <div className="flex-1 w-full flex flex-col items-center py-8 px-6 overflow-y-auto">
          <div className="bg-white p-10 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center max-w-md w-full animate-slide-up border-b-[12px] border-blue-50 my-auto">
            <div className="relative mb-10 flex justify-center">
              <div 
                onClick={triggerFileInput}
                className="w-48 h-48 rounded-full p-2 bg-gradient-to-tr from-blue-500 via-blue-400 to-indigo-500 shadow-2xl animate-float cursor-pointer group relative"
              >
                <div className="w-full h-full rounded-full overflow-hidden border-8 border-white bg-slate-50">
                  <img 
                    src={customAvatar} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                    alt="Super Miss" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = TEACHER_AVATAR;
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <i className="fa-solid fa-camera text-white text-3xl"></i>
                </div>
              </div>
              <div className="absolute -bottom-3 bg-green-500 text-white text-[13px] font-black px-6 py-2 rounded-full border-4 border-white flex items-center gap-2 shadow-xl">
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                Super Miss is Ready! ✨
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-blue-600 mb-1 tracking-tight">Super Miss!</h1>
            <p className="text-slate-400 font-bold mb-8 tracking-widest uppercase text-xs">Primary 2 • Terms 1 & 2</p>
            
            <div className="space-y-6 text-left">
              <div className="group">
                <label className="block text-slate-500 font-black text-xs uppercase mb-2 ml-2 transition-colors group-focus-within:text-blue-500">Your Hero Name 🦸‍♂️</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full p-5 border-2 border-slate-50 rounded-3xl focus:outline-none focus:border-blue-400 focus:ring-8 focus:ring-blue-50 text-gray-800 font-bold text-xl transition-all placeholder:text-slate-200 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-black text-xs uppercase mb-2 ml-2">Teaching Style 🎨</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMode(TeachingMode.MIXED)}
                    className={`py-5 rounded-3xl border-2 transition-all font-black ${mode === TeachingMode.MIXED ? 'bg-blue-600 border-blue-700 text-white shadow-xl -translate-y-1' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <div className="text-sm">English + بالعربي</div>
                  </button>
                  <button 
                    onClick={() => setMode(TeachingMode.ENGLISH_ONLY)}
                    className={`py-5 rounded-3xl border-2 transition-all font-black ${mode === TeachingMode.ENGLISH_ONLY ? 'bg-blue-600 border-blue-700 text-white shadow-xl -translate-y-1' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <div className="text-sm">English Only</div>
                  </button>
                </div>
              </div>
            </div>

            <button 
              disabled={!userName.trim()}
              onClick={() => setIsStarted(true)}
              className="mt-10 w-full py-6 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-2xl rounded-3xl transition-all shadow-2xl shadow-orange-200 active:scale-95 flex items-center justify-center gap-4"
            >
              LET'S LEARN! 🚀
            </button>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 z-30 flex justify-between items-center shrink-0 border-b border-slate-100">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedUnit(null)}>
              <div className="relative" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
                <img 
                  src={customAvatar} 
                  className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover bg-slate-50 transition-transform group-hover:scale-110" 
                  alt="Miss" 
                  onError={(e) => { (e.target as HTMLImageElement).src = TEACHER_AVATAR; }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <i className="fa-solid fa-camera text-white text-[10px]"></i>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-blue-600 leading-none">Super Miss</h1>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Primary 2 • Term 1 & 2</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => setShowModelInfo(true)}
                className="w-10 h-10 flex items-center justify-center bg-slate-900 text-blue-400 rounded-full hover:scale-110 transition-all shadow-lg border border-slate-700"
              >
                <i className="fa-solid fa-microchip animate-pulse"></i>
              </button>

              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-slate-400 uppercase font-black">Student</p>
                <p className="text-blue-600 font-black text-sm">{userName} ⭐</p>
              </div>
              <button 
                onClick={() => setMode(mode === TeachingMode.MIXED ? TeachingMode.ENGLISH_ONLY : TeachingMode.MIXED)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-full text-xs font-black border border-blue-200 text-blue-600 transition-all uppercase"
              >
                {mode}
              </button>
            </div>
          </header>

          <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto overflow-hidden relative">
            {selectedUnit ? (
              <div className="flex-1 flex flex-col p-2 sm:p-4 h-full min-h-0">
                <LessonView 
                  unit={selectedUnit} 
                  mode={mode} 
                  userName={userName} 
                  teacherAvatar={customAvatar}
                  onBack={() => setSelectedUnit(null)} 
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <Dashboard units={CURRICULUM} onSelectUnit={setSelectedUnit} />
              </div>
            )}
          </main>
        </>
      )}

      {showModelInfo && <ModelInfoModal onClose={() => setShowModelInfo(false)} />}
    </div>
  );
};

export default App;
