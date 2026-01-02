import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { isValidDigest } from '../lib/sui';

interface TxInputProps {
  onSearch: (digest: string) => void;
  isLoading: boolean;
}

export function TxInput({ onSearch, isLoading }: TxInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    
    // Extract digest from URL if a URL is pasted
    let digest = trimmed;
    if (trimmed.includes('/tx/')) {
        const parts = trimmed.split('/tx/');
        if (parts[1]) {
            digest = parts[1].split('?')[0].split('/')[0];
        }
    }

    if (!isValidDigest(digest)) {
      setError('Invalid transaction digest format.');
      return;
    }

    setError('');
    onSearch(digest);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm"
            placeholder="Paste Sui Transaction Digest (or URL)..."
            value={input}
            onChange={(e) => {
                setInput(e.target.value);
                if(error) setError('');
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input}
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Explain</span>
              </>
            )}
          </button>
        </div>
        {error && (
            <p className="absolute -bottom-8 left-2 text-red-400 text-sm font-medium animate-fade-in">
                {error}
            </p>
        )}
      </form>
    </div>
  );
}
