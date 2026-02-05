import { useState, useEffect } from 'react';
import { TxInput } from './components/TxInput';
import { TxSummary } from './components/TxSummary';
import { TxVisualizer } from './components/TxVisualizer';
import { getTransaction } from './lib/sui';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Sparkles, Terminal, ArrowLeft } from 'lucide-react';

function App() {
  const [txData, setTxData] = useState<SuiTransactionBlockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loadingMessage, setLoadingMessage] = useState('');
  const [resetKey, setResetKey] = useState(0);

  // Sync URL on search
  const handleSearch = async (digest: string) => {
    setLoading(true);
    setError('');
    setTxData(null);
    
    // Verify manual persistence handling - Do NOT set URL here to keep browser refresh clean
    // The previous logic of syncing URL caused "Refresh" to verify the transaction
    // The user explicitly wants "Refresh" to Reset the state.
    
    // Progressive Loader Simulation
    const messages = [
        "Connecting to Sui Mainnet...",
        "Fetching transaction details...",
        "Decoding Move arguments...",
        "Analyzing object changes...",
        "Finalizing explanation..."
    ];
    let msgIdx = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        setLoadingMessage(messages[msgIdx]);
    }, 800);

    try {
      const data = await getTransaction(digest);
      clearInterval(interval);
      setTxData(data);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError('Failed to fetch transaction details. Check the digest and try again.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Load from URL on mount, then CLEAR URL to ensure "Refresh" = Reset
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const digest = params.get('digest');
      if (digest) {
          handleSearch(digest);
          // Clean the URL immediately so user feels "safe" to refresh to reset
          window.history.replaceState({}, '', window.location.pathname);
      }
  }, []);

  const copyLink = () => {
      // Construct link manually since URL bar is clean
      if (!txData?.digest) return;
      const url = `${window.location.origin}${window.location.pathname}?digest=${txData.digest}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
  };

  const SHOWCASE_TXS = [
    {
        title: "Complex DeFi Swap",
        digest: "7VBExxDhrromDf9LLhYEfLK7s63TXvLeyw8DY4ixzBz1", 
        why: "Analyzes 7-step PTB across Move modules",
        icon: "💱" 
    },
    {
        title: "NFT Price Change",
        digest: "6cQiM3uR1r4LE5BfrtbBAQLEd1widjBfrGgdrE9wjTZa",
        why: "TradePort NFT Action & Object Updates",
        icon: "🖼️"
    },
    {
        title: "Failed Programmable Tx",
        digest: "28waKcWjuTHmwmoEkNN3UxNvrsvCPZgmVv5yW5cS9kST",
        why: "Shows error decoding & fix suggestions",
        icon: "⚠️"
    }
  ];

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
      <TxInput key={resetKey} onSearch={handleSearch} isLoading={loading} />
      
      {/* Progressive Loading Text */}
      {loading && (
          <div className="text-center -mt-6 mb-8 text-blue-400/80 text-sm font-mono animate-pulse">
              {loadingMessage}
          </div>
      )}

      {/* Example Transactions (Interview Prep) */}
      {!txData && !loading && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-4 animate-fade-in-up delay-100">
           {SHOWCASE_TXS.map((tx, i) => (
             <button
               key={i}
               onClick={() => handleSearch(tx.digest)}
               className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left"
             >
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-blue-400 font-medium text-sm">{tx.icon}</span>
                 <span className="text-slate-200 font-semibold text-sm">{tx.title}</span>
               </div>
               <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                 {tx.why}
               </p>
             </button>
           ))}
        </div>
      )}

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
            <div className="flex items-center justify-between max-w-4xl mx-auto -mb-6 px-2">
                 <button 
                    onClick={() => {
                        setTxData(null);
                        setLoading(false);
                        setResetKey(prev => prev + 1);
                        const cleanUrl = window.location.pathname;
                        window.history.pushState({}, '', cleanUrl);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700 hover:border-slate-600"
                 >
                    <ArrowLeft className="w-4 h-4" /> Explain Another
                 </button>

                 <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-all text-sm font-medium border border-blue-500/20">
                    <Sparkles className="w-4 h-4" /> Share Result
                 </button>
            </div>
            <TxVisualizer key={`viz-${txData.digest}`} tx={txData} />
            <TxSummary key={`sum-${txData.digest}`} tx={txData} />
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
