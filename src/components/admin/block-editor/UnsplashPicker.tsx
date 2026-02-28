import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, ImageIcon } from 'lucide-react';

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
}

interface UnsplashPickerProps {
  onSelect: (url: string, alt: string) => void;
}

const UnsplashPicker = ({ onSelect }: UnsplashPickerProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-search', {
        body: { query: query.trim(), per_page: 9 },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch (err) {
      console.error('Unsplash search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search Unsplash..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="text-sm"
        />
        <Button size="icon" variant="outline" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
          {results.map((img) => (
            <button
              key={img.id}
              onClick={() => onSelect(img.url, img.alt)}
              className="group relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
            >
              <img
                src={img.thumb}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 truncate w-full">
                  {img.author}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center py-4 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-1" />
          <p className="text-xs">No results found</p>
        </div>
      )}
    </div>
  );
};

export default UnsplashPicker;
