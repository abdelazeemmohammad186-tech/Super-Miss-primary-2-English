
import React, { useState, useEffect, useRef } from 'react';
import { Unit, TeachingMode, Message, LessonStep } from '../types';
import { getTeacherResponse, generateSpeech, playAudioBuffer } from '../services/geminiService';

interface LessonViewProps {
  unit: Unit;
  mode: TeachingMode;
  userName: string;
  teacherAvatar: string;
  onBack: () => void;
}

const STEPS: LessonStep[] = [
  'WARM_UP',
  'VOCABULARY',
  'PRONUNCIATION',
  'PHONICS',
  'SONG',
  'ACTIVITY',
  'REVISION'
];

const LessonView: React.FC<LessonViewProps> = ({ unit, mode, userName, teacherAvatar, onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDialogueActive, setIsDialogueActive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const dialogueActiveRef = useRef(false);

  const currentStep = STEPS[currentStepIndex];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      // جعلناه مستمراً ليعطي الطفل وقتاً، ويغلقه يدوياً
      recognizer.continuous = true; 
      recognizer.interimResults = false;
      recognizer.lang = mode === TeachingMode.MIXED ? 'ar-EG' : 'en-US';

      recognizer.onstart = () => {
        setIsListening(true);
      };

      recognizer.onend = () => {
        setIsListening(false);
        // لا نعيد التشغيل إذا تم إغلاقه يدوياً أو إذا كانت الميس تتحدث
        if (dialogueActiveRef.current && !isSpeakingRef.current) {
          try { recognizer.start(); } catch (e) {}
        }
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript && !isSpeakingRef.current) {
          processUserResponse(transcript);
        }
      };
      recognitionRef.current = recognizer;
    }
    
    return () => {
      dialogueActiveRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, [mode]);

  const toggleDialogueMode = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!recognitionRef.current) {
      alert("عذراً، متصفحك لا يدعم التعرف على الصوت.");
      return;
    }

    if (dialogueActiveRef.current) {
      dialogueActiveRef.current = false;
      setIsDialogueActive(false);
      try { recognitionRef.current.stop(); } catch (e) {}
    } else {
      dialogueActiveRef.current = true;
      setIsDialogueActive(true);
      setInputValue("");
      try { 
        recognitionRef.current.start(); 
      } catch (e) {
        console.error("Mic start error:", e);
      }
    }
  };

  const systemPrompt = `You are "Super Miss", the 3D superhero teacher. 
  Student: ${userName}. Mode: ${mode}. Lesson: ${unit.title}.
  
  CORE RULES:
  1. BILINGUAL CONTENT: For every English word or sentence, follow it immediately with "يعني [Arabic translation]".
     Example: "The chair is blue يعني الكرسي لونه أزرق".
  2. SLOW DELIVERY: Keep sentences short. Imagine you are teaching a 7-year-old child in Egypt.
  3. INTERACTIVE: Ask simple questions. If they answer correctly, cheer!
  4. START CLEARLY: Begin each step with a friendly introduction.`;

  const processUserResponse = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue("");
    setIsTyping(true);
    isSpeakingRef.current = true;
    
    // نوقف الميكروفون مؤقتاً لضمان سماع الرد بوضوح
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    try {
      const responseText = await getTeacherResponse(text, systemPrompt);
      setMessages(prev => [...prev, { role: 'teacher', text: responseText }]);
      
      const audio = await generateSpeech(responseText);
      if (audio) {
        await playAudioBuffer(audio);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
      isSpeakingRef.current = false;
      // لا نعيد فتح الميكروفون إلا إذا كان الطفل لا يزال في وضع المحادثة النشط
      if (dialogueActiveRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    }
  };

  const handleExplain = async () => {
    if (isTyping || isSpeakingRef.current) return;
    setIsTyping(true);
    isSpeakingRef.current = true;
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}

    try {
      const explainPrompt = `Explain "${currentStep}" from "${unit.title}". Read the English words/sentences then their Arabic meanings slowly.`;
      const responseText = await getTeacherResponse(explainPrompt, systemPrompt);
      setMessages(prev => [...prev, { role: 'teacher', text: responseText }]);
      
      const audio = await generateSpeech(responseText);
      if (audio) await playAudioBuffer(audio);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
      isSpeakingRef.current = false;
      if (dialogueActiveRef.current) try { recognitionRef.current.start(); } catch(e) {}
    }
  };

  const handleManualSend = () => inputValue.trim() && processUserResponse(inputValue);
  
  const handleNextStep = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
    processUserResponse(`أنا مستعد للمرحلة الجاية يا سوبر ميس! 🚀`);
  };

  useEffect(() => {
    const init = async () => {
      setIsTyping(true);
      isSpeakingRef.current = true;
      const welcome = await getTeacherResponse(`Start Unit ${unit.id} intro for ${userName}. Speak very slowly, English then Arabic translation.`, systemPrompt);
      setMessages([{ role: 'teacher', text: welcome }]);
      const audio = await generateSpeech(welcome);
      if (audio) await playAudioBuffer(audio);
      setIsTyping(false);
      isSpeakingRef.current = false;
    };
    init();
  }, []);

  // تصحيح التمرير: التوجه فوراً لقمة الرسالة الجديدة (scroll-mt-24 يضمن ظهورها تحت الهيدر)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const container = scrollRef.current;
      // نستخدم requestAnimationFrame لضمان أن المتصفح رسم الرسالة أولاً
      requestAnimationFrame(() => {
        const bubbles = container.querySelectorAll('.message-bubble');
        const lastBubble = bubbles[bubbles.length - 1];
        if (lastBubble) {
          lastBubble.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [messages, isTyping]); // يستجيب فور إضافة الرسالة أو بدء الكتابة

  const getStatus = () => {
    if (isSpeakingRef.current && !isTyping) return { text: 'سوبر ميس بتتكلم بالراحة.. اسمعها!', color: 'text-green-500' };
    if (isTyping) return { text: 'سوبر ميس بتحضر الشرح...', color: 'text-blue-500' };
    if (isListening) return { text: 'سوبر ميس بتسمعك.. اتكلم!', color: 'text-red-500' };
    return { text: '', color: '' };
  };

  const status = getStatus();

  return (
    <div className="flex flex-col h-full bg-white rounded-[45px] shadow-2xl overflow-hidden animate-slide-up border-[12px] border-white relative">
      {/* Header */}
      <div className="shrink-0 h-24 p-5 border-b border-slate-50 flex items-center justify-between bg-white z-40 relative">
        <button onClick={onBack} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-blue-500 bg-slate-50 rounded-2xl transition-all">
          <i className="fa-solid fa-arrow-left-long"></i>
        </button>
        
        <div className="text-center flex-1 mx-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-slate-800 text-sm leading-tight truncate max-w-[150px] sm:max-w-none">
              {unit.title}
            </h3>
            <button 
              onClick={handleExplain}
              disabled={isTyping || isSpeakingRef.current}
              className="bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <i className={`fa-solid ${isSpeakingRef.current ? 'fa-volume-high animate-bounce' : 'fa-play'} text-[8px]`}></i>
              اسمع سوبر ميس
            </button>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentStep} • {currentStepIndex+1}/7</p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">
           {Math.round(((currentStepIndex + 1) / 7) * 100)}%
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 bg-[#f8faff] relative overflow-hidden">
        <div 
          ref={scrollRef} 
          className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex flex-col gap-8 pb-20"
        >
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`message-bubble flex items-start gap-3 sm:gap-4 ${msg.role === 'teacher' ? 'justify-start' : 'justify-end'} animate-fade-in scroll-mt-24`}
            >
              {msg.role === 'teacher' && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white mt-1">
                  <img src={teacherAvatar} className="w-full h-full object-cover" alt="Teacher" />
                </div>
              )}
              <div className={`max-w-[85%] p-4 sm:p-5 rounded-[28px] shadow-sm text-base sm:text-lg relative border-2 ${
                msg.role === 'teacher' ? 'bg-white text-slate-800 rounded-tl-none border-blue-50' : 'bg-blue-600 text-white rounded-br-none border-blue-500'
              }`}>
                <div className="font-bold leading-relaxed whitespace-pre-wrap text-start break-words" dir="auto">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          
          {(isTyping || isSpeakingRef.current) && (
            <div className="flex justify-start items-center gap-3 sm:gap-4 animate-fade-in message-bubble scroll-mt-24">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border-4 border-slate-50 flex items-center justify-center overflow-hidden">
                <img src={teacherAvatar} className={`w-full h-full object-cover ${isTyping ? 'opacity-30 grayscale' : 'animate-pulse'}`} alt="..." />
              </div>
              <div className="bg-white px-5 py-3 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-bounce bg-green-500`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.1s] bg-green-600`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] bg-green-400`}></div>
                </div>
                {status.text && (
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${status.color}`}>
                    {status.text}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 p-4 sm:p-6 bg-white border-t border-slate-100 z-50 flex flex-col gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative group">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
              placeholder="اكتب ردك هنا..."
              disabled={isTyping || isSpeakingRef.current}
              className="w-full p-4 pr-12 rounded-2xl border-2 border-slate-100 focus:border-blue-400 focus:outline-none text-slate-800 font-bold bg-slate-50/50 transition-all placeholder:text-slate-300 disabled:opacity-50"
              dir="auto"
            />
            <button 
              onClick={handleManualSend} 
              disabled={isTyping || isSpeakingRef.current}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 active:scale-90 transition-all disabled:bg-slate-300"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={toggleDialogueMode}
              disabled={isTyping || isSpeakingRef.current}
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all border-4 border-white shadow-xl shrink-0 group ${
                isDialogueActive 
                  ? 'bg-red-500 text-white scale-110' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${isListening ? 'ring-8 ring-red-100' : ''} disabled:opacity-50 disabled:grayscale`}
            >
              <i className={`fa-solid ${isDialogueActive ? 'fa-microphone' : 'fa-microphone-slash'} text-2xl group-active:scale-90 transition-transform`}></i>
              <span className="text-[8px] font-black mt-1 uppercase">
                {isDialogueActive ? 'إغلاق المايك' : 'فتح المايك'}
              </span>
            </button>
            {isDialogueActive && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-black px-4 py-1.5 rounded-xl animate-bounce whitespace-nowrap shadow-xl border-2 border-white">
                جاوب يا بطل وبعدين دوس "إغلاق"! 🛑
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleNextStep}
          disabled={isTyping || isSpeakingRef.current}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white font-black rounded-2xl shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg"
        >
          المرحلة الجاية في الحدوتة! <i className="fa-solid fa-wand-magic-sparkles"></i>
        </button>
      </div>
    </div>
  );
};

export default LessonView;
