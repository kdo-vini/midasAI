import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Loader2, Square, Wand2 } from 'lucide-react';
import { parseTransactionFromText, parseTransactionFromAudio } from '../services/geminiService';
import { AIParsedTransaction } from '../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SmartInputProps {
  onTransactionParsed: (data: AIParsedTransaction) => void;
  categories: string[];
}

export const SmartInput: React.FC<SmartInputProps> = ({ onTransactionParsed, categories }) => {
  const [inputText, setInputText] = useState('');
  
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleResponse = (result: AIParsedTransaction) => {
    if (!result.isTransaction) {
      alert("A IA não identificou uma transação financeira válida nesta mensagem.");
      return;
    }
    onTransactionParsed(result);
    setInputText('');
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmittingText(true);
    try {
      // Pass categories to enforce strict matching
      const result = await parseTransactionFromText(inputText, categories);
      handleResponse(result);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmittingText(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/ogg;codecs=opus'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      if (!selectedMimeType) selectedMimeType = 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const finalMimeType = mediaRecorder.mimeType || selectedMimeType;
        const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob, finalMimeType);
      };

      mediaRecorder.start();

      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interimTranscript += event.results[i][0].transcript;
          }
          if (interimTranscript) {
             setInputText(interimTranscript); 
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Erro ao acessar microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessingAudio(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        
        const result = await parseTransactionFromAudio(base64Content, mimeType, categories);
        handleResponse(result);
      };
    } catch (error) {
      console.error("Audio processing error:", error);
      alert('Não entendi o áudio. Tente novamente.');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-indigo-50 mb-6 relative overflow-hidden transition-all duration-300">
      
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between text-slate-400 text-sm mb-1">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium uppercase tracking-wide">IA Assistant</span>
          </div>
          {isRecording && (
            <span className="text-red-500 font-bold text-xs animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              OUVINDO...
            </span>
          )}
        </div>
        
        <form onSubmit={handleTextSubmit} className="flex gap-2 items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? "Fale agora..." : "Ex: Recebi 500 de bônus..."}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-base ${
                isRecording 
                  ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 placeholder-indigo-300' 
                  : 'bg-slate-50 border-slate-200 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400'
              }`}
              disabled={isProcessingAudio || isSubmittingText} 
              readOnly={isRecording}
            />

            {isProcessingAudio && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-start px-4 border border-indigo-100">
                 <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Processando sua mensagem...</span>
                 </div>
              </div>
            )}
          </div>

          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-all animate-pulse shadow-lg shadow-red-200 flex-shrink-0"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isProcessingAudio || isSubmittingText}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors border flex-shrink-0 ${
                isProcessingAudio || isSubmittingText 
                  ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessingAudio || isSubmittingText || isRecording}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shadow-md flex-shrink-0 ${
                isProcessingAudio || isSubmittingText || isRecording || !inputText.trim()
                ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            {isSubmittingText ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};