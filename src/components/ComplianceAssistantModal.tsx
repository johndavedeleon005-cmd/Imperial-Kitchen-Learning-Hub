import React, { useState } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import { X, Sparkles, Send, RotateCcw, Bot, User, CheckCircle2, Flame } from 'lucide-react';

interface ComplianceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc?: FoodSafetyDoc | null;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const ComplianceAssistantModal: React.FC<ComplianceAssistantModalProps> = ({
  isOpen,
  onClose,
  activeDoc,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your Jiangnan Hotpot Food Safety & Compliance Intelligence Assistant. Ask me any operational rule, temperature threshold, color code, or corrective action across our 21 policies and SOPs.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'What is the 15-minute cold chain rule?',
    'Which cutting board is used for raw poultry?',
    'Can an employee work with a fever or sore throat?',
    'What color towel is used for dining room tables?',
    'What should I do if a glass breaks in the kitchen?',
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/compliance-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          contextDocTitle: activeDoc ? `${activeDoc.code}: ${activeDoc.title}` : undefined,
          contextDocContent: activeDoc ? `${activeDoc.summary}\n${activeDoc.keyTakeaways.join('\n')}` : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer || 'No response returned.' },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Compliance Reference Guidance: Under RA 10611 and Imperial Kitchen Group standards, ensure strict adherence to cold chain limits (≤4°C storage, ≤-18°C frozen, max 1 hour in 5°C-60°C Danger Zone), and never cross-contaminate color-coded zones.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full h-[620px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Compliance Q&A Assistant</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Ground in RA 10611, PD 856 & IKQAP Documents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-red-600 text-white font-medium rounded-tr-sm shadow-md'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-sm shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-300">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-red-400" />
              <span>Consulting compliance policies...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your food safety question..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-all shadow-md active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
