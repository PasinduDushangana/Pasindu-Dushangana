import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Zap, Search, BrainCircuit, Volume2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, ThinkingLevel, Modality } from '@google/genai';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
};

type Mode = 'fast' | 'standard' | 'deep' | 'search';

export function StudyAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Ayubowan! I am your SL Scholar assistant. How can I help with your studies today?' }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let modelName = 'gemini-3-flash-preview';
      let config: any = {
        systemInstruction: "You are a helpful tutor for Sri Lankan students. You understand the local educational context (O/L, A/L syllabus). Be encouraging and clear."
      };

      if (mode === 'fast') {
        modelName = 'gemini-3.1-flash-lite-preview';
      } else if (mode === 'deep') {
        modelName = 'gemini-3.1-pro-preview';
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (mode === 'search') {
        modelName = 'gemini-3-flash-preview';
        config.tools = [{ googleSearch: {} }];
        config.toolConfig = { includeServerSideToolInvocations: true };
      }

      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: userMsg.text,
        config
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          setMessages(prev => prev.map(m => 
            m.id === modelMsgId ? { ...m, text: fullText } : m
          ));
        }
      }
      
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, text: 'Sorry, I encountered an error. Please try again.', isStreaming: false } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (text: string, messageId: string) => {
    if (playingAudioId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    try {
      setPlayingAudioId(messageId);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: text,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const audioUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
      } else {
        setPlayingAudioId(null);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setPlayingAudioId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-800">Study Assistant</h2>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <ModeButton current={mode} mode="fast" icon={Zap} label="Fast" onClick={setMode} />
          <ModeButton current={mode} mode="standard" icon={Sparkles} label="Standard" onClick={setMode} />
          <ModeButton current={mode} mode="deep" icon={BrainCircuit} label="Deep Think" onClick={setMode} />
          <ModeButton current={mode} mode="search" icon={Search} label="Web Search" onClick={setMode} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm relative group ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none text-gray-800'
            }`}>
              {msg.role === 'model' && !msg.isStreaming && (
                <button 
                  onClick={() => playTTS(msg.text, msg.id)}
                  className="absolute -right-12 top-2 p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-sm border border-gray-100"
                  title="Read aloud"
                >
                  {playingAudioId === msg.id ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
                </button>
              )}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap m-0">{msg.text}</p>
                ) : (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                )}
                {msg.isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle"></span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your studies..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-[60px] overflow-hidden shadow-sm"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-3 text-xs font-medium text-gray-400">
          {mode === 'deep' ? 'Using High Thinking mode. Responses may take longer.' : 
           mode === 'search' ? 'Using Google Search to find up-to-date information.' : 
           'Press Enter to send, Shift+Enter for new line'}
        </div>
      </div>
    </div>
  );
}

function ModeButton({ current, mode, icon: Icon, label, onClick }: { current: Mode, mode: Mode, icon: any, label: string, onClick: (m: Mode) => void }) {
  const isActive = current === mode;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive ? 'bg-white text-blue-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 border border-transparent'
      }`}
    >
      <Icon size={16} className={isActive ? 'text-blue-600' : ''} />
      {label}
    </button>
  );
}
