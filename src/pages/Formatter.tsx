import React, { useState, useEffect } from 'react';
import { aiSimulator } from '../utils/aiSimulator';
import { toast } from '../store/toastStore';
import { useActivityStore } from '../store/activityStore';
import { 
  Sparkles, 
  Scissors, 
  Maximize2, 
  Copy, 
  Check, 
  Trash2, 
  FileText,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';

export const FormatterPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [streamedOutput, setStreamedOutput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentAction, setCurrentAction] = useState<'optimize' | 'shorten' | 'enlarge' | null>(null);

  // Statistics
  const getWordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const inputWords = getWordCount(inputText);
  const outputWords = getWordCount(outputText);

  // Simulated Streaming/Typing Effect
  useEffect(() => {
    if (!outputText) {
      setStreamedOutput('');
      return;
    }

    setStreamedOutput('');
    let idx = 0;
    const words = outputText.split(' ');
    
    const interval = setInterval(() => {
      if (idx < words.length) {
        setStreamedOutput(prev => prev + (prev ? ' ' : '') + words[idx]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 25); // Faster typing speed for readability

    return () => clearInterval(interval);
  }, [outputText]);

  const handleActionClick = async (action: 'optimize' | 'shorten' | 'enlarge') => {
    if (!inputText.trim()) {
      toast.error('Please input some text to format');
      return;
    }

    setProcessing(true);
    setCurrentAction(action);
    setOutputText('');
    setStreamedOutput('');

    try {
      const response = await aiSimulator.formatText(inputText, action);
      setOutputText(response);
      toast.success(`Text successfully processed by AI!`);
      useActivityStore.getState().addLog(
        'ai', 
        `Formatted text draft using "${action}" model (${inputWords} input words)`
      );
    } catch (err) {
      toast.error('AI text processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyClick = () => {
    // Strip out markdown headers/bold syntax for plain clipboard copying
    const plainText = outputText.replace(/\*\*|✨|⚡|🚀/g, '').replace(/###\s/g, '');
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    toast.success('Formatted text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearText = () => {
    setInputText('');
    setOutputText('');
    setStreamedOutput('');
    setCurrentAction(null);
  };

  const handleLoadSample = () => {
    setInputText(
      "i am writing to tell you that the dashboard is very simple and we need to fix the alignment of the ui layout because it does not look premium also we should connect the supabase tables so we can save our data instead of losing it when we refresh the browser window"
    );
    toast.info('Sample text loaded');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 select-none">
          AI Text Formatter
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Polish grammar, summarize content, or elaborate bullet points instantly.
        </p>
      </div>

      {/* Main Grid: Input & Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Side: Text Input Panel */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between gap-5 bg-white dark:bg-slate-900/30">
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                <span>Original Copy</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadSample}
                  className="text-xxs font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 px-2.5 py-1.5 rounded-lg border border-indigo-100/30 dark:border-indigo-900/20 cursor-pointer"
                >
                  Load Sample
                </button>
                <button
                  onClick={handleClearText}
                  className="text-xxs font-bold text-rose-500 hover:text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded-lg border border-rose-100/30 dark:border-rose-900/20 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Input Slate */}
            <textarea
              rows={10}
              placeholder="Paste or write your text draft here..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full flex-1 p-4 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-800 dark:text-white leading-relaxed"
            />
          </div>

          {/* Input Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/20">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {inputWords} words · {inputText.length} characters
            </span>
          </div>
        </div>

        {/* Right Side: AI Assistant Output Panel */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between gap-5 bg-gradient-to-br from-indigo-500/[0.01] to-blue-500/[0.01]">
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
                <Zap className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <span>AI Refined Copy</span>
              </span>
              
              {/* Copy Button */}
              {outputText && !processing && (
                <button
                  onClick={handleCopyClick}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    copied
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 hover:shadow-sm"
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Output'}</span>
                </button>
              )}
            </div>

            {/* Output Box */}
            <div className="w-full flex-1 p-5 text-sm bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/25 rounded-2xl flex flex-col justify-center min-h-[220px]">
              {processing ? (
                /* Pulsing Loading Skeleton */
                <div className="flex flex-col gap-3 py-4 w-full shimmer">
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-3/4 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-5/6 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-2/3 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-4/5 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider self-center mt-4 flex items-center gap-1">
                    <Clock className="h-3 w-3 animate-spin text-indigo-500" />
                    <span>AI is formulating response...</span>
                  </span>
                </div>
              ) : streamedOutput ? (
                /* Beautiful Rich Markdown-like text rendering with typing cursor */
                <div className="flex flex-col gap-4 text-slate-700 dark:text-slate-300 leading-relaxed font-sans max-h-[300px] overflow-y-auto pr-1">
                  <div className="whitespace-pre-line text-xs md:text-sm">
                    {streamedOutput}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse shrink-0 align-middle" />
                  </div>
                </div>
              ) : (
                /* Empty Slate */
                <div className="flex flex-col items-center justify-center text-center select-none py-10">
                  <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3 animate-pulse-subtle" />
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Assistant Idle</span>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                    Choose one of the core AI formatting operations below to process your draft copy.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Output Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/20">
            {outputText && !processing ? (
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {outputWords} refined words · Compression: {Math.max(0, Math.round(((inputWords - outputWords) / inputWords) * 100))}%
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase">
                <Info className="h-3 w-3 text-indigo-500 shrink-0" />
                <span>Streaming tokens in real time</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. AI ACTION BAR PANEL */}
      <div className="glass-panel rounded-3xl p-5 bg-white dark:bg-slate-900/30 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Refine with AI Core</span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Select an optimization model to analyze and reshape your text.
            </p>
          </div>
        </div>

        {/* Dynamic Buttons Layout */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => handleActionClick('optimize')}
            disabled={processing || !inputText.trim()}
            className={cn(
              "flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-premium select-none cursor-pointer border",
              currentAction === 'optimize' && outputText
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Optimize Draft</span>
          </button>

          <button
            onClick={() => handleActionClick('shorten')}
            disabled={processing || !inputText.trim()}
            className={cn(
              "flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-premium select-none cursor-pointer border",
              currentAction === 'shorten' && outputText
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white"
            )}
          >
            <Scissors className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Shorten / Condense</span>
          </button>

          <button
            onClick={() => handleActionClick('enlarge')}
            disabled={processing || !inputText.trim()}
            className={cn(
              "flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-premium select-none cursor-pointer border",
              currentAction === 'enlarge' && outputText
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white"
            )}
          >
            <Maximize2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Expand / Detail</span>
          </button>
        </div>
      </div>
    </div>
  );
};
