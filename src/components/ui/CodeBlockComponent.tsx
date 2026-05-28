import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';

export const CodeBlockComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = node.textContent;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAttributes({ language: e.target.value });
  };

  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 bg-slate-950 text-slate-100 overflow-hidden font-mono text-sm shadow-md">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800/60 text-[10px] font-bold text-slate-400 select-none">
        <select
          value={node.attrs.language || 'auto'}
          onChange={handleLanguageChange}
          className="bg-transparent border-0 outline-none text-slate-400 hover:text-slate-200 cursor-pointer pr-4 font-mono font-bold capitalize focus:ring-0"
        >
          <option value="auto" className="bg-slate-900 text-slate-400">auto</option>
          <option value="javascript" className="bg-slate-900 text-slate-400">javascript</option>
          <option value="typescript" className="bg-slate-900 text-slate-400">typescript</option>
          <option value="html" className="bg-slate-900 text-slate-400">html</option>
          <option value="css" className="bg-slate-900 text-slate-400">css</option>
          <option value="python" className="bg-slate-900 text-slate-400">python</option>
          <option value="bash" className="bg-slate-900 text-slate-400">bash</option>
          <option value="sql" className="bg-slate-900 text-slate-400">sql</option>
        </select>
        
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      <pre className="p-4 overflow-x-auto bg-slate-950 m-0 leading-normal">
        <NodeViewContent className="font-mono text-sm block outline-none" />
      </pre>
    </NodeViewWrapper>
  );
};
