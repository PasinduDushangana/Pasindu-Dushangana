import { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';

export function LocalResources() {
  const [query, setQuery] = useState('Find nearby public libraries and bookshops');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [places, setPlaces] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        },
        (err) => {
          console.warn(err);
          setLocationError("Could not get your location. Results may not be perfectly localized.");
          // Default to Colombo, Sri Lanka if denied
          setLocation({ lat: 6.9271, lng: 79.8612 });
        }
      );
    } else {
      setLocation({ lat: 6.9271, lng: 79.8612 });
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    setResult('');
    setPlaces([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const config: any = {
        tools: [{ googleMaps: {} }]
      };

      if (location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config
      });

      setResult(response.text || '');

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedPlaces = chunks
          .filter(c => c.maps?.uri)
          .map(c => ({
            title: c.maps?.title || 'Location',
            uri: c.maps?.uri
          }));
        setPlaces(extractedPlaces);
      }

    } catch (error) {
      console.error(error);
      setResult('Failed to search for resources. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Local Resources</h2>
          <p className="text-gray-600 mt-2 text-lg">Find libraries, bookshops, and educational centers near you.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          {locationError && (
            <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl flex items-start gap-3 border border-amber-100">
              <MapPin size={18} className="mt-0.5 shrink-0" />
              <p className="font-medium">{locationError} Defaulting to Colombo, Sri Lanka.</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="E.g., Find nearby tuition centers for A/L Science..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
            >
              {isSearching ? <Loader2 size={22} className="animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {(result || isSearching) && (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 space-y-5">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="font-medium">Searching Google Maps...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="prose prose-blue max-w-none">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                
                {places.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-5">Map Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {places.map((place, idx) => (
                        <a 
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group shadow-sm"
                        >
                          <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:bg-blue-200 transition-colors">
                            <Navigation size={20} />
                          </div>
                          <span className="font-semibold text-gray-800 truncate">{place.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
