/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Image as ImageIcon,
  Send,
  Layout,
  Settings,
  History,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  Search,
  MessageSquare,
  Wand2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  timestamp: number;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'images'>('chat');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      if (activeTab === 'chat') {
        const response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: input,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text || "I'm sorry, I couldn't generate a response.",
          type: 'text',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Image generation logic
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: input }],
          },
        });

        let imageUrl = '';
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Generated image for: ${input}`,
          type: 'image',
          imageUrl: imageUrl,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "An error occurred during generation. Please check your API key and try again.",
        type: 'text',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#F27D26] selection:text-black">
      {/* Sidebar - Rail Style */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/10 flex flex-col items-center py-8 gap-8 bg-[#0a0a0a] z-50">
        <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)]">
          <Sparkles className="w-6 h-6 text-black" strokeWidth={2.5} />
        </div>

        <nav className="flex flex-col gap-6 flex-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'images' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <button className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <Wand2 className="w-6 h-6" />
          </button>
        </nav>

        <button className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <Settings className="w-6 h-6" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-16 h-screen flex flex-col relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F27D26]/10 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4f46e5]/10 rounded-full blur-[120px] opacity-30" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight uppercase">
              {activeTab === 'chat' ? 'Cognitive Stream' : 'Visual Forge'}
            </h1>
            <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold text-white/40 tracking-widest uppercase">
              Pro v1.0
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all"><History className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all"><Plus className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Messaging Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scroll-smooth z-10 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4"
              >
                {activeTab === 'chat' ? <MessageSquare className="w-10 h-10 text-[#F27D26]" /> : <ImageIcon className="w-10 h-10 text-[#F27D26]" />}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-medium"
              >
                {activeTab === 'chat' ? 'How can I assist your creativity today?' : 'Describe what you want to bring to life.'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/40 text-lg"
              >
                Lumina AI is powered by Gemini, giving you state-of-the-art performance for {activeTab === 'chat' ? 'reasoning and text' : 'high-fidelity image generation'}.
              </motion.p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                    ? 'bg-[#F27D26] text-black font-medium'
                    : 'bg-white/5 border border-white/10'
                    }`}
                >
                  {msg.type === 'image' ? (
                    <div className="space-y-4">
                      <p className="text-sm opacity-60 italic mb-2">{msg.content}</p>
                      {msg.imageUrl ? (
                        <div className="relative group rounded-xl overflow-hidden shadow-2xl">
                          <img src={msg.imageUrl} alt="Generated" className="w-full h-auto rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"><Download className="w-5 h-5" /></button>
                            <button className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"><RefreshCw className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-white/5 animate-pulse rounded-xl" />
                      )}
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </Markdown>
                    </div>
                  )}
                  <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-black/40' : 'text-white/20'} font-mono`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-center gap-3 text-white/40"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
              </div>
              <span className="text-xs font-mono tracking-wider uppercase">Processing...</span>
            </motion.div>
          )}
        </div>

        {/* Input Dock */}
        <div className="p-8 z-10">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-[#F27D26]/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-xl flex items-end gap-2 focus-within:border-[#F27D26]/50 transition-colors shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={activeTab === 'chat' ? "Ask anything..." : "A futuristic city in the clouds..."}
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-white placeholder:text-white/20 min-h-[56px] max-h-48 custom-scrollbar"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className={`p-3 rounded-xl transition-all ${input.trim() && !isGenerating
                  ? 'bg-white text-black hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-white/20 border border-white/5'
                  }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center mt-4 text-white/20 font-mono tracking-widest uppercase">
            Gemini Pro • Experimental Creative Engine • No Limits
          </p>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
