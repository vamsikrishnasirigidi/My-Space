import React, { useState, useEffect } from 'react';
import { aiSimulator } from '../utils/aiSimulator';
import { toast } from '../store/toastStore';
import { useActivityStore } from '../store/activityStore';
import { 
  Sparkles, 
  Mail, 
  HelpCircle,
  Copy, 
  Check, 
  PenTool,
  Clock,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';

// Resilient inline social icons
const LinkedinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export const GeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'email' | 'linkedin' | 'instagram' | 'custom'>('email');
  const [emailTone, setEmailTone] = useState<'professional' | 'short' | 'formal' | 'friendly'>('professional');
  const [linkedinHook, setLinkedinHook] = useState<'viral' | 'technical' | 'standard'>('standard');
  const [outputText, setOutputText] = useState('');
  const [streamedOutput, setStreamedOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  type ContentType = 'email' | 'linkedin' | 'instagram' | 'custom';

  // Statistics
  const getWordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const outputWords = getWordCount(outputText);

  // Streaming Text Word-by-Word Reveal
  useEffect(() => {
    if (!outputText) {
      return;
    }

    let idx = 0;
    const words = outputText.split(' ');
    
    const interval = setInterval(() => {
      if (idx < words.length) {
        setStreamedOutput(prev => prev + (prev ? ' ' : '') + words[idx]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 20); // Speedy, robust typing reveals

    return () => clearInterval(interval);
  }, [outputText]);

  const handleGenerateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please specify a prompt or topic for the AI');
      return;
    }

    setGenerating(true);
    setOutputText('');
    setStreamedOutput('');

    try {
      const response = await aiSimulator.generateContent(prompt, contentType, {
        emailTone,
        linkedinHook
      });
      setOutputText(response);
      toast.success('AI content generation complete!');
      useActivityStore.getState().addLog(
        'ai', 
        `Generated AI ${contentType === 'email' ? `email (${emailTone} tone)` : contentType === 'linkedin' ? `LinkedIn post (${linkedinHook} hook)` : contentType} content for prompt: "${prompt.slice(0, 30)}..."`
      );
    } catch {
      toast.error('AI content generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyClick = () => {
    // Strip out markdown headers/bold syntax for plain clipboard copying
    const plainText = outputText.replace(/\*\*|✨|⚡|🚀|📬|💼|📸|🔮/g, '').replace(/###\s/g, '');
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    toast.success('Generated copy copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadTemplate = (topic: string) => {
    setPrompt(topic);
    toast.info('Template topic loaded into prompt area');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 select-none">
          AI Content Generator
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Generate high-conversion cold emails, viral LinkedIn frameworks, or trendy social copy in seconds.
        </p>
      </div>

      {/* Main Grid Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Hand: Prompt Configurator (5 Cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between gap-6 bg-white dark:bg-slate-900/30">
          <form onSubmit={handleGenerateClick} className="flex flex-col gap-4 flex-1">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
              <PenTool className="h-4.5 w-4.5 text-indigo-500" />
              <span>Prompt Architect</span>
            </span>

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Core Topic or Context
              </label>
              <textarea
                rows={5}
                required
                placeholder="e.g. cold outreach for my new space SaaS app, introducing calendar widgets and Notion-inspired notes module to increase focus..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-800 dark:text-white leading-relaxed"
              />
            </div>

            {/* Content Format Selector Cards */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Target Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'email', label: 'Outreach Email', icon: Mail, color: 'text-indigo-500' },
                  { id: 'linkedin', label: 'LinkedIn Post', icon: LinkedinIcon, color: 'text-blue-500' },
                  { id: 'instagram', label: 'Instagram Copy', icon: InstagramIcon, color: 'text-pink-500' },
                  { id: 'custom', label: 'Custom Prompt', icon: HelpCircle, color: 'text-emerald-500' },
                ].map(opt => {
                  const isSelected = contentType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setContentType(opt.id as ContentType)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all text-left shadow-sm select-none cursor-pointer",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                          : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/20 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <opt.icon className={cn("h-4 w-4 shrink-0", opt.color)} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Tone/Hook Selectors */}
            {contentType === 'email' && (
              <div className="flex flex-col gap-1.5 mt-1 animate-fade-in">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Email Tone
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['professional', 'short', 'formal', 'friendly'] as const).map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setEmailTone(tone)}
                      className={cn(
                        "px-3 py-2 text-xxs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer text-center",
                        emailTone === tone
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                          : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/20 text-slate-450 dark:text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {contentType === 'linkedin' && (
              <div className="flex flex-col gap-1.5 mt-1 animate-fade-in">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  LinkedIn Hook Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['standard', 'viral', 'technical'] as const).map(hook => (
                    <button
                      key={hook}
                      type="button"
                      onClick={() => setLinkedinHook(hook)}
                      className={cn(
                        "px-2 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer text-center",
                        linkedinHook === hook
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                          : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/20 text-slate-450 dark:text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {hook}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Templates */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Quick Template Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Cold proposal for SaaS collaboration",
                  "Launch announcement for visual planner app",
                  "Overcoming cognitive load in hybrid teams",
                ].map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleLoadTemplate(topic)}
                    className="text-[9px] font-bold text-slate-500 hover:text-indigo-500 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-950/20 dark:hover:bg-indigo-950/30 border border-slate-200/30 dark:border-slate-800/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left line-clamp-1"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Form Trigger Button */}
          <button
            type="submit"
            onClick={handleGenerateClick}
            disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-50 hover:shadow-premium font-bold text-sm transition-all duration-300 disabled:opacity-50 cursor-pointer relative overflow-hidden select-none"
          >
            {generating ? (
              <>
                <Clock className="h-4.5 w-4.5 animate-spin text-indigo-500" />
                <span>Generating copy...</span>
              </>
            ) : (
              <>
                <Send className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>

        {/* Right Hand: AI Content Reader (7 Cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between gap-6 bg-gradient-to-br from-indigo-500/[0.01] to-blue-500/[0.01]">
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
                <Zap className="h-4.5 w-4.5 text-indigo-500" />
                <span>Generated Master Copy</span>
              </span>

              {/* Copy Output Button */}
              {outputText && !generating && (
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

            {/* Generated display box */}
            <div className="w-full flex-1 p-5 text-sm bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/25 rounded-2xl flex flex-col justify-center min-h-[300px]">
              {generating ? (
                /* Pulsing loader skeletons */
                <div className="flex flex-col gap-3 py-6 w-full shimmer">
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-3/4 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-5/6 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-2/3 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-4/5 animate-pulse" />
                  <div className="h-4 bg-slate-200/80 dark:bg-slate-800/60 rounded-md w-1/2 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider self-center mt-5 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    <span>AI is drafting your copy block...</span>
                  </span>
                </div>
              ) : streamedOutput ? (
                /* Streaming content layout */
                <div className="flex flex-col gap-4 text-slate-700 dark:text-slate-300 leading-relaxed font-sans max-h-[380px] overflow-y-auto pr-1">
                  <div className="whitespace-pre-line text-xs md:text-sm">
                    {streamedOutput}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse shrink-0 align-middle" />
                  </div>
                </div>
              ) : (
                /* Empty / Idle State */
                <div className="flex flex-col items-center justify-center text-center select-none py-14">
                  <Sparkles className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse-subtle" />
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Writer Dormant</span>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                    Enter a context draft and choose a formatting template to synthesize modern outreach models.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/20">
            {outputText && !generating ? (
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {outputWords} generated words · ready to share
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase">
                <Info className="h-3 w-3 text-indigo-500 shrink-0" />
                <span>Includes dynamic copywriter hooks</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
