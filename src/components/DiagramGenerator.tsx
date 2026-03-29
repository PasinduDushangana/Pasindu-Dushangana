import { useState } from 'react';
import { ImagePlus, Loader2, Download, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function DiagramGenerator() {
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<'standard' | 'studio'>('standard');
  const [size, setSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = quality === 'studio' ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: size
          }
        }
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          setGeneratedImage(`data:${part.inlineData.mimeType || 'image/png'};base64,${base64}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        setError("No image was returned. Please try a different prompt.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Diagrams & Art Generator</h2>
          <p className="text-gray-600 mt-2 text-lg">Create educational diagrams, illustrations, or project art.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A detailed diagram of a plant cell with labels, clean educational style..."
              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Quality</label>
              <select 
                value={quality} 
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="standard">Standard (Fast)</option>
                <option value="studio">Studio Quality</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Size</label>
              <select 
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {quality === 'standard' && <option value="512px">512px</option>}
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Aspect Ratio</label>
              <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3 (Landscape)</option>
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="3:4">3:4 (Portrait)</option>
                <option value="9:16">9:16 (Vertical)</option>
                {quality === 'standard' && (
                  <>
                    <option value="1:4">1:4</option>
                    <option value="4:1">4:1</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm mt-4"
          >
            {isGenerating ? <Loader2 size={22} className="animate-spin" /> : <Sparkles size={22} />}
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        {error && (
          <div className="p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Result</h3>
              <a 
                href={generatedImage} 
                download="generated-diagram.png"
                className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download size={16} /> Download
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center min-h-[400px] border border-gray-200">
              <img src={generatedImage} alt="Generated" className="max-w-full h-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
