
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
      recognizer.continuous = false; 
      recognizer.interimResults = false;
      recognizer.lang = mode === TeachingMode.MIXED ? 'ar-EG' : 'en-US';

      recognizer.onstart = () => {
        setIsListening(true);
      };

      recognizer.onend = () => {
        setIsListening(false);
        if (dialogueActiveRef.current && !isSpeakingRef.current) {
          try { 
            recognizer.start(); 
          } catch (e) {
            console.log("Recognition restart failed");
          }
        }
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
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

  const systemPrompt = `You are "Super Miss", teaching ${unit.title}. Use stories and end with a question. Student: ${userName}. Mode: ${mode}. Be encouraging and fun!`;

  const processUserResponse = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue("");
    setIsTyping(true);
    isSpeakingRef.current = true;
    
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
      const explainPrompt = `Can you explain the current lesson step (${currentStep}) from "${unit.title}" to me in a very clear and funny way? Mention some of these words: ${unit.vocabulary.slice(0, 3).join(', ')}.`;
      const responseText = await getTeacherResponse(explainPrompt, systemPrompt);
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
      if (dialogueActiveRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
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
      const welcome = await getTeacherResponse(`Start Unit ${unit.id} with an exciting story intro for Grade 2 student ${userName}.`, systemPrompt);
      setMessages([{ role: 'teacher', text: welcome }]);
      const audio = await generateSpeech(welcome);
      if (audio) await playAudioBuffer(audio);
      setIsTyping(false);
      isSpeakingRef.current = false;
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const container = scrollRef.current;
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isTyping]);

  const getStatus = () => {
    if (isTyping) return { text: 'سوبر ميس بتفكر...', color: 'text-blue-500', dot: 'bg-blue-500 animate-pulse' };
    if (isListening) return { text: 'سوبر ميس بتسمعك.. اتكلم!', color: 'text-red-500', dot: 'bg-red-500 animate-ping' };
    if (isDialogueActive) return { text: 'الميكروفون شغال.. مستنية صوتك', color: 'text-green-500', dot: 'bg-green-500' };
    return { text: 'الميكروفون مقفول.. دوس عشان تتكلم', color: 'text-slate-400', dot: 'bg-slate-300' };
  };

  const status = getStatus();

  return (
    <div className="flex flex-col h-full bg-white rounded-[45px] shadow-2xl overflow-hidden animate-slide-up border-[12px] border-white relative">
      {/* Header */}
      <div className="shrink-0 h-28 p-5 border-b border-slate-50 flex items-center justify-between bg-white z-40 relative">
        <button onClick={onBack} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-blue-500 bg-slate-50 rounded-2xl transition-all">
          <i className="fa-solid fa-arrow-left-long"></i>
        </button>
        
        <div className="text-center flex-1 mx-2 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${status.color}`}>
              {status.text}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-800 text-sm leading-tight truncate max-w-[120px] sm:max-w-none">
              {unit.title}
            </h3>
            {/* New Explain Button */}
            <button 
              onClick={handleExplain}
              disabled={isTyping}
              className="bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <i className="fa-solid fa-volume-high animate-pulse"></i>
              اسمع سوبر ميس
            </button>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{currentStep} • {currentStepIndex+1}/7</p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">
           {Math.round(((currentStepIndex + 1) / 7) * 100)}%
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 bg-[#f8faff] relative overflow-hidden">
        <div 
          ref={scrollRef} 
          className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex flex-col gap-6 pb-12"
        >
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`message-bubble flex items-start gap-3 sm:gap-4 ${msg.role === 'teacher' ? 'justify-start' : 'justify-end'} animate-fade-in`}
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
          
          {isTyping && (
            <div className="flex justify-start items-center gap-3 sm:gap-4 animate-fade-in">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border-4 border-slate-50 flex items-center justify-center overflow-hidden grayscale">
                <img src={teacherAvatar} className="w-full h-full object-cover opacity-30" alt="..." />
              </div>
              <div className="bg-white px-5 py-3 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
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
              disabled={isTyping}
              className="w-full p-4 pr-12 rounded-2xl border-2 border-slate-100 focus:border-blue-400 focus:outline-none text-slate-800 font-bold bg-slate-50/50 transition-all placeholder:text-slate-300"
              dir="auto"
            />
            <button 
              onClick={handleManualSend} 
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 active:scale-90 transition-all"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={toggleDialogueMode}
              disabled={isTyping}
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all border-4 border-white shadow-xl shrink-0 group ${
                isDialogueActive 
                  ? 'bg-red-500 text-white scale-105' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${isListening ? 'ring-4 ring-red-100' : ''}`}
            >
              <i className={`fa-solid ${isDialogueActive ? 'fa-microphone' : 'fa-microphone-slash'} text-2xl group-active:scale-90 transition-transform`}></i>
              <span className="text-[8px] font-black mt-1 uppercase">{isDialogueActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <button 
          onClick={handleNextStep}
          disabled={isTyping}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg"
        >
          المرحلة الجاية في الحدوتة! <i className="fa-solid fa-wand-magic-sparkles"></i>
        </button>
      </div>
    </div>
  );
};

export default LessonView;
