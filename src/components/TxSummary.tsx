import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Box, Coins, FileText, Sparkles, Zap, ChevronDown } from 'lucide-react';
import { formatAddress, formatBalance } from '../lib/utils';
import { checkAiHealth, generateAiExplanation } from '../lib/ai';
import { identifyProtocol } from '../lib/protocols';
import { TxActivity } from './TxActivity';

// Helper Component for Collapsible Sections
function CollapsibleSection({ title, icon, count, children, defaultOpen = false }: { title: string, icon: React.ReactNode, count?: number, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden shadow-xl transition-all">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/80 transition-colors"
            >
                <div className="flex items-center gap-2 text-slate-200">
                    {icon}
                    <h3 className="font-semibold text-lg">{title}</h3>
                    {count !== undefined && (
                        <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">{count}</span>
                    )}
                </div>
                <div className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>
            <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0 border-t border-slate-700/50">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface TxSummaryProps {
  tx: SuiTransactionBlockResponse;
}

export function TxSummary({ tx }: TxSummaryProps) {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActive, setAiActive] = useState(false);

  useEffect(() => {
    checkAiHealth().then(setAiActive);
  }, []);

  const status = tx.effects?.status.status;
  const error = tx.effects?.status.error;
  const sender = tx.transaction?.data.sender;
  const gasUsed = tx.effects?.gasUsed;
  const totalGas = gasUsed 
    ? (BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost) - BigInt(gasUsed.storageRebate)).toString()
    : '0';
  
  const gasInSui = formatBalance(totalGas);

  const balanceChanges = tx.balanceChanges || [];
  const objectChanges = tx.objectChanges || [];
  
  const createdObjects = objectChanges.filter(o => o.type === 'created');
  const mutatedObjects = objectChanges.filter(o => o.type === 'mutated');
  const published = objectChanges.filter(o => o.type === 'published');

  // Extract Move Call
  let moveCallLabel = "Transaction";
  let protocolInfo = null;

  const txKind = tx.transaction?.data.transaction;
  if (txKind?.kind === 'ProgrammableTransaction') {
      const moveCall = txKind.transactions.find((t: any) => 'MoveCall' in t);
      if (moveCall) {
          const mc = (moveCall as any).MoveCall;
          moveCallLabel = `${mc.module}::${mc.function}`;
          protocolInfo = identifyProtocol(mc.package);
      }
  }

  // Simple narrative generation
  const receivers = balanceChanges.filter(b => {
      const owner = b.owner as any;
      return BigInt(b.amount) > 0 && owner?.AddressOwner !== sender;
  });

  let narrative = "The transaction interact with the network.";
  if (protocolInfo) {
      narrative = `Sender interacted with ${protocolInfo.name} ${protocolInfo.icon} (${moveCallLabel}).`;
  } else if (moveCallLabel !== "Transaction") {
       narrative = `Sender called ${moveCallLabel}.`;
  } else if (receivers.length === 1) {
      const amt = formatBalance(receivers[0].amount);
      const recipient = (receivers[0].owner as any).AddressOwner;
      narrative = `Sender transferred ${amt} SUI to ${formatAddress(recipient)}.`;
  } else if (receivers.length > 1) {
      narrative = `Sender transferred SUI to ${receivers.length} recipients.`;
  }

  // Helper to parse object types (e.g., 0x2::coin::Coin<SUI> -> Coin<SUI>)
  const formatObjectType = (type: string) => {
      // Handle Coin<...> specifically
      if (type.includes('::coin::Coin<')) {
          const coinType = type.match(/<(.+)>/)?.[1] || 'Unknown';
          const shortCoin = coinType.split('::').pop();
          return `Coin (${shortCoin})`;
      }
      
      // Handle Dynamic Fields
      if (type.startsWith('0x2::dynamic_field::Field')) {
          return 'Dynamic Field (Internal)';
      }
      if (type.startsWith('0x2::object::ID')) return 'Object ID';

      // General Cleanup
      const parts = type.split('::');
      if (parts.length >= 3) return parts.slice(2).join('::').split('<')[0]; // Remove generics for cleaner view
      return type;
  };

  const isRelevantObject = (type: string) => {
      // Hide extremely low level system objects from the main view to reduce noise
      if (type.includes('dynamic_field')) return false;
      return true;
  };

  const relevantMutated = mutatedObjects.filter(o => isRelevantObject(o.objectType));
  const hiddenCount = mutatedObjects.length - relevantMutated.length;

  // AI Generation Effect
  useEffect(() => {
    if (aiEnabled && !aiExplanation && !aiLoading && aiActive) {
        setAiLoading(true);
        const summaryData = {
            sender,
            status,
            moveCall: moveCallLabel,
            balanceChanges: balanceChanges.map((b: any) => ({ amount: b.amount, coinType: b.coinType })),
            objectChangesCount: objectChanges.length
        };
        
        generateAiExplanation(summaryData).then(res => {
            setAiExplanation(res.explanation || res.error || "No explanation generated.");
            setAiLoading(false);
        });
    }
  }, [aiEnabled, aiActive, tx]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Narrative Section with AI Toggle */}
      <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            {aiEnabled ? <Sparkles className="w-6 h-6 animate-pulse text-purple-400" /> : <FileText className="w-6 h-6" />}
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
                    {aiEnabled ? "AI Analysis (Preview)" : "Summary"}
                </h3>
                 <div className="flex items-center gap-2">
                    {aiActive && (
                        <label className="flex items-center cursor-pointer relative group">
                            <input type="checkbox" className="sr-only peer" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            <span className="ml-2 text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">AI Mode</span>
                        </label>
                    )}
                </div>
            </div>
            
            {aiEnabled ? (
                <div className="min-h-[60px] animate-in fade-in duration-300">
                    {aiLoading ? (
                        <div className="flex items-center gap-2 text-purple-300/70 text-sm animate-pulse">
                            <Sparkles className="w-4 h-4" /> Generating insight via Groq LPU...
                        </div>
                    ) : (
                        <p className="text-purple-200/90 leading-relaxed font-mono text-sm">{aiExplanation}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-700/30 pt-2">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-orange-400" />
                            POWERED BY GROQ & LLAMA 3.3
                        </div>
                        {aiExplanation && !aiLoading && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900/30 rounded-full border border-green-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-[10px] font-medium text-green-300 uppercase tracking-wide">
                                    {protocolInfo ? 'High Confidence' : 'Medium Confidence'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-blue-200/80 leading-relaxed font-mono text-sm">{narrative}</p>
            )}
        </div>
      </div>

      {/* High-Level Activity Feed (New) */}
      <TxActivity tx={tx} />

      {/* Status & Diagnostics */}
      <div className={`p-5 rounded-xl border ${status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-100'} animate-in fade-in slide-in-from-bottom-2`}>
        <div className="flex items-start justify-between">
            <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-lg ${status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6 text-red-500" />}
                </div>
                <div>
                    <h3 className="font-bold text-lg capitalize tracking-tight flex items-center gap-2">
                        {status}
                        {status !== 'success' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Failed</span>}
                    </h3>
                    
                    {status !== 'success' && error && (
                        <div className="mt-3 space-y-2">
                            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-sm font-mono text-red-200/90 break-all">
                                {error}
                            </div>
                            
                            {/* Simple Diagnostics Heuristics */}
                            <div className="text-sm text-red-300/80 flex flex-col gap-1">
                                <span className="font-semibold uppercase text-[10px] tracking-wider text-red-400">Potential Cause:</span>
                                {error.includes('InsufficientBalance') || error.includes('Balance') ? (
                                    <span>Sender attempted to spend more SUI than available in gas or transfer.</span>
                                ) : error.includes('MoveAbort') ? (
                                    <span>The smart contract logic rejected the input (Move Abort). Check the function arguments.</span>
                                ) : (
                                    <span>Transaction execution halted due to an on-chain error.</span>
                                )}
                            </div>
                        </div>
                    )}
                    
                     {status === 'success' && <p className="text-green-200/60 text-sm mt-1">Transaction successfully executed on Sui Mainnet.</p>}
                </div>
            </div>

            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Gas Consumed</div>
                <div className="font-mono font-bold text-xl text-slate-200 tracking-tight">
                    {gasInSui} <span className="text-sm text-slate-500 font-normal">SUI</span>
                </div>
                <div className="text-xs text-green-400/80 font-mono mt-0.5">
                    ≈ ${(parseFloat(gasInSui) * 3.42).toFixed(4)} USD
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Changes - Collapsible */}
        <CollapsibleSection 
            title="Balance Changes" 
            icon={<Coins className="w-5 h-5 text-blue-400" />} 
            count={balanceChanges.length}
            defaultOpen={true}
        >
          {balanceChanges.length === 0 ? (
            <p className="text-slate-500 italic mt-4">No balance changes.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mt-4">
              {balanceChanges.map((change, idx) => {
                 const amount = BigInt(change.amount);
                 const isPositive = amount > 0;
                 const fmtAmount = formatBalance(amount);
                 const ownerAddr = change.owner.hasOwnProperty('AddressOwner') ? (change.owner as any).AddressOwner : 'Object';

                 return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600 transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isPositive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            {isPositive ? '+' : '-'}
                        </div>
                        <div>
                             <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{isPositive ? 'Received' : 'Sent'}</div>
                             <div className="font-mono text-sm text-slate-300 truncate w-32 md:w-48" title={ownerAddr}>{formatAddress(ownerAddr)}</div>
                        </div>
                     </div>
                     <div className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                         {isPositive ? '+' : ''}{fmtAmount} <span className="text-xs opacity-70">SUI</span>
                     </div>
                  </div>
                 );
              })}
            </div>
          )}
        </CollapsibleSection>

        {/* Object Updates - Collapsible */}
        <CollapsibleSection
            title="Object Updates"
            icon={<Box className="w-5 h-5 text-purple-400" />}
            count={published.length + createdObjects.length + relevantMutated.length}
            defaultOpen={true}
        >
          <div className="space-y-4 flex-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mt-4">
             {published.length > 0 && (
                <div className="space-y-2">
                    <div className="text-[10px] uppercase text-blue-400/80 font-bold tracking-wider sticky top-0 bg-slate-900/95 backdrop-blur py-1 z-10">Published Packages</div>
                    {published.map((_, i) => (
                         <div key={i} className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                            <span className="text-blue-200 text-sm font-mono truncate">Package</span>
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">New</span>
                         </div>
                    ))}
                </div>
             )}
             
             {createdObjects.length > 0 && (
                <div className="space-y-2">
                    <div className="text-[10px] uppercase text-green-400/80 font-bold tracking-wider sticky top-0 bg-slate-900/95 backdrop-blur py-1 z-10">Created Objects</div>
                    {createdObjects.map((obj, i) => (
                        <div key={i} className="p-3 bg-green-900/10 border border-green-500/20 rounded-lg flex items-center justify-between gap-2 hover:bg-green-900/20 transition-colors">
                            <span className="text-green-300 text-sm font-medium truncate" title={obj.objectType}>
                                {formatObjectType(obj.objectType)}
                            </span>
                             <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">+ Created</span>
                        </div>
                    ))}
                </div>
             )}

             {relevantMutated.length > 0 && (
                 <div className="space-y-2">
                    <div className="text-[10px] uppercase text-amber-400/80 font-bold tracking-wider sticky top-0 bg-slate-900/95 backdrop-blur py-1 z-10">Updated Assets</div>
                    <div className="grid grid-cols-1 gap-2">
                        {relevantMutated.map((obj, i) => (
                             <div key={i} className="p-2.5 bg-slate-800/40 rounded border border-slate-700/50 text-slate-300 text-sm font-medium truncate hover:border-slate-500 transition-colors flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                {formatObjectType(obj.objectType)}
                             </div>
                        ))}
                    </div>
                 </div>
             )}
             
              {hiddenCount > 0 && (
                 <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                     <span className="text-xs text-slate-600 italic">
                         + {hiddenCount} low-level system objects hidden
                     </span>
                 </div>
             )}
             {objectChanges.length === 0 && <p className="text-slate-500 italic">No object changes.</p>}
          </div>
        </CollapsibleSection>
      </div>
      
      {/* Sender Info */}
       <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between text-sm text-slate-400">
          <span>Sender</span>
          <span className="font-mono text-slate-300" title={sender}>{formatAddress(sender)}</span>
       </div>

    </div>
  );
}
