import { useState } from 'react';
import { TxInput } from './components/TxInput';
import { TxSummary } from './components/TxSummary';
import { TxVisualizer } from './components/TxVisualizer';
import { getTransaction } from './lib/sui';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Sparkles, Terminal } from 'lucide-react';

function App() {
  const [txData, setTxData] = useState<SuiTransactionBlockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (digest: string) => {
    setLoading(true);
    setError('');
    setTxData(null);

    try {
      const data = await getTransaction(digest);
      setTxData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transaction details. Check the digest and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Sui Transaction Explainer</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Decode the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Block</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Paste a Sui transaction digest to get a human-readable summary of what actually happened.
        </p>
      </div>

      {/* Input Section */}
      <TxInput onSearch={handleSearch} isLoading={loading} />

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-2xl mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 animate-pulse">
            <Terminal className="w-5 h-5" />
            <p>{error}</p>
        </div>
      )}

      {/* Results Section */}
      {txData && (
        <div className="w-full space-y-8 animate-fade-in-up">
            <TxVisualizer tx={txData} />
            <TxSummary tx={txData} />
            
            <div className="text-center pt-8">
                <button 
                    onClick={() => {
                        setTxData(null);
                    }}
                    className="text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                    Explain another transaction
                </button>
            </div>
        </div>
      )}

      {/* Footer */}
      {!txData && (
          <div className="mt-20 text-center text-slate-500 text-sm">
            Built with React, Vite, Tailwind & Mysten SDK.
          </div>
      )}

    </div>
  );
}

export default App;
