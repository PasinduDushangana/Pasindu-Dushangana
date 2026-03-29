import { useEffect, useState } from 'react';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export function ApiKeyGuard({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const result = await window.aistudio.hasSelectedApiKey();
        setHasKey(result);
      } else {
        // If not in AI Studio environment with this API, assume we have the env key
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasKey(true);
    }
  };

  if (hasKey === null) return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">Loading...</div>;

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">API Key Required</h1>
          <p className="mb-6 text-gray-600">
            To use the advanced AI features in SL Scholar (like high-quality image generation and deep thinking), you need to select a Google Cloud project with billing enabled.
            <br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">Learn more about billing</a>
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
