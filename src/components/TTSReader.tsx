import { useState, useRef } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';

export function TTSReader() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayStop = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!text.trim()) return;

    setIsLoading(true);
    try {
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
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      alert("Failed to generate speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Text Reader</h2>
          <p className="text-gray-600 mt-2 text-lg">Paste your notes or reading materials to listen to them.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here to read aloud..."
            className="w-full h-80 border border-gray-300 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed text-gray-800 bg-gray-50 text-lg"
          />
          
          <div className="flex justify-end">
            <button
              onClick={handlePlayStop}
              disabled={(!text.trim() && !isPlaying) || isLoading}
              className={`px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all shadow-sm ${
                isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : isPlaying ? (
                <Square size={22} className="fill-current" />
              ) : (
                <Volume2 size={22} />
              )}
              {isLoading ? 'Processing...' : isPlaying ? 'Stop Reading' : 'Read Aloud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
