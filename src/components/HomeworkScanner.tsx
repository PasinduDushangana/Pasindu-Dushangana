import { useState, useRef } from 'react';
import { Upload, X, ScanSearch, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';

export function HomeworkScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('Please explain this image and solve any problems shown step-by-step.');
  const [result, setResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setResult('');
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = image.split(',')[1];

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          setResult(fullText);
        }
      }
    } catch (error) {
      console.error(error);
      setResult('Error analyzing image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Homework Scanner</h2>
          <p className="text-gray-600 mt-2 text-lg">Upload a photo of your worksheet, textbook, or notes for AI analysis.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {!image ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-3xl bg-white p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all h-[400px] shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-blue-100 p-5 rounded-full text-blue-600 mb-6">
                  <Upload size={40} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Image</h3>
                <p className="text-gray-500">Click to browse or drag and drop</p>
                <p className="text-sm font-medium text-gray-400 mt-4 uppercase tracking-wider">Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="relative rounded-3xl overflow-hidden bg-gray-900 h-[400px] flex items-center justify-center group shadow-md border border-gray-200">
                <img src={image} alt="Uploaded homework" className="max-h-full max-w-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Instructions for AI</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
                rows={3}
              />
              <button
                onClick={analyzeImage}
                disabled={!image || isAnalyzing}
                className="mt-4 w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <ScanSearch size={20} />}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[600px] lg:h-auto overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles size={20} className="text-blue-600" />
                Analysis Result
              </h3>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              {result ? (
                <div className="prose prose-blue max-w-none">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-5">
                  <Loader2 size={40} className="animate-spin text-blue-600" />
                  <p className="font-medium">Processing image with Gemini 3.1 Pro...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-4">
                  <div className="bg-gray-50 p-6 rounded-full">
                    <ScanSearch size={48} className="text-gray-300" />
                  </div>
                  <p className="max-w-xs">Upload an image and click Analyze to see the results here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
