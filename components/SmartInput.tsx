import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Loader2, Square, Wand2, Sparkles, X } from 'lucide-react';
import { parseTransactionFromText } from '../services/openaiService';
import { AIParsedTransaction, Transaction, BudgetGoal, MonthlyStats } from '../types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SmartInputProps {
  onTransactionParsed: (data: AIParsedTransaction) => void;
  categories: string[];
  currentDate: Date;
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  monthlyStats: MonthlyStats;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  onTransactionParsed,
  categories,
  currentDate,
  transactions,
  budgetGoals,
  monthlyStats
}) => {
  const { t, i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleResponse = (result: AIParsedTransaction) => {
    // Always show the AI message if present
    if (result.message) {
      setAiMessage(result.message);
    }

    if (result.isTransaction) {
      onTransactionParsed(result);
      setInputText('');
    } else {
      // If it's just a chat response, we keep the text or clear it? 
      // Let's clear it to indicate processing is done.
      setInputText('');
    }
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmittingText(true);
    setAiMessage(null); // Clear previous message
    try {
      const result = await parseTransactionFromText(inputText, categories, currentDate, i18n.language, transactions, budgetGoals, monthlyStats);
      handleResponse(result);
    } catch (error) {
      console.error(error);
      toast.error(t('smartInput.errorProcessing'));
    } finally {
      setIsSubmittingText(false);
    }
  };

  const startRecording = async () => {
    setAiMessage(null); // Clear previous message
    try {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = i18n.language;
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
        setIsRecording(true);
      } else {
        toast.error(t('smartInput.browserNotSupported'));
      }
    } catch (err) {
      console.error("Error accessing microphone", err);
      toast.error(t('smartInput.micError'));
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    // Process the transcribed text directly
    if (inputText.trim()) {
      setIsProcessingAudio(true);
      try {
        const result = await parseTransactionFromText(inputText, categories, currentDate, i18n.language, transactions, budgetGoals, monthlyStats);
        handleResponse(result);
      } catch (error) {
        console.error("Audio processing error:", error);
        toast.error(t('smartInput.audioError'));
      } finally {
        setIsProcessingAudio(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-indigo-50 dark:border-slate-700 mb-6 relative overflow-hidden transition-all duration-300">

      {/* AI Message Display */}
      {aiMessage && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="bg-indigo-100 dark:bg-indigo-800 p-1.5 rounded-lg flex-shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div className="flex-grow">
            <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">{aiMessage}</p>
          </div>
          <button
            onClick={() => setAiMessage(null)}
            className="text-indigo-400 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-sm mb-1">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
            <span className="text-xs font-medium uppercase tracking-wide">{t('smartInput.assistantLabel')}</span>
          </div>
          {isRecording && (
            <span className="text-red-500 font-bold text-xs animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              {t('smartInput.listeningStatus')}
            </span>
          )}
        </div>

        <form onSubmit={handleTextSubmit} className="flex gap-2 items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? t('smartInput.speakNow') : t('smartInput.example')}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-base ${isRecording
                ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 placeholder-indigo-300'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500'
                }`}
              disabled={isProcessingAudio || isSubmittingText}
              readOnly={isRecording}
            />

            {isProcessingAudio && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-start px-4 border border-indigo-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">{t('smartInput.processingMessage')}</span>
                </div>
              </div>
            )}
          </div>

          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-all animate-pulse shadow-lg shadow-red-200 dark:shadow-none flex-shrink-0"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isProcessingAudio || isSubmittingText}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors border flex-shrink-0 ${isProcessingAudio || isSubmittingText
                ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-slate-600'
                }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessingAudio || isSubmittingText || isRecording}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shadow-md flex-shrink-0 ${isProcessingAudio || isSubmittingText || isRecording || !inputText.trim()
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 shadow-none cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
              }`}
          >
            {isSubmittingText || isProcessingAudio ? (
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