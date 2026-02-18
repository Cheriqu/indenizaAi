// src/app/mission-control/components/GlobalSearch.tsx
import { useState, useRef, useEffect } from "react";
import { Search, Loader2, FileText, User, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SearchResult {
  type: 'lead' | 'memory' | 'document';
  title: string;
  content: string;
  link: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSearch = (term: string) => {
    setQuery(term);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (term.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/search?q=${encodeURIComponent(term)}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Erro search:", err);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="relative flex-1 max-w-2xl mx-auto z-50 group" ref={wrapperRef}>
      <div className="relative transform transition-all focus-within:scale-[1.02]">
        <input 
          type="text" 
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Busque por leads, memórias ou documentos..."
          className="w-full bg-white/50 border border-gray-200 backdrop-blur-sm rounded-xl py-3 pl-12 pr-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:border-blue-200 transition-all shadow-sm focus:shadow-lg"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
      </div>

      {/* Resultados Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar divide-y divide-gray-50">
          {results.map((res, idx) => (
            <Link 
              key={idx} 
              to={res.link} 
              className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group/item relative overflow-hidden"
              onClick={() => setIsOpen(false)}
            >
              <div className={`p-3 rounded-lg shadow-sm border border-transparent group-hover/item:shadow-md transition-all ${res.type === 'lead' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                {res.type === 'lead' ? <User className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm group-hover/item:text-blue-600 truncate flex items-center justify-between">
                  {res.title}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:text-blue-400 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-[-5px] group-hover/item:translate-x-0" />
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: res.content.replace(new RegExp(query, "gi"), (match) => `<span class='bg-yellow-200 font-bold text-yellow-900 px-0.5 rounded'>${match}</span>`) }} />
              </div>
            </Link>
          ))}
          <div className="bg-gray-50/50 p-2 text-center text-xs text-gray-400 font-medium border-t border-gray-50">
            Pressione <kbd className="font-mono bg-white border border-gray-200 rounded px-1 shadow-sm text-gray-500">Enter</kbd> para ver todos
          </div>
        </div>
      )}
      
      {isOpen && results.length === 0 && !loading && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl p-8 text-center text-gray-500 text-sm border border-gray-100 animate-in fade-in zoom-in duration-200">
          <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-300" />
          </div>
          <p className="font-medium text-gray-600">Nenhum resultado encontrado</p>
          <p className="text-xs text-gray-400 mt-1">Tente buscar por outro termo ou verifique a ortografia.</p>
        </div>
      )}
    </div>
  );
}
