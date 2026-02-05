import { useState } from 'react';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { ArrowRight, Layers, RefreshCcw, Landmark, Box } from 'lucide-react';
import { formatAddress, formatBalance } from '../lib/utils';
import { identifyProtocol } from '../lib/protocols';

interface TxActivityProps {
  tx: SuiTransactionBlockResponse;
}

export function TxActivity({ tx }: TxActivityProps) {
  const events = tx.events || [];

  // Helper to extract amount from event JSON (recursively search for common amount fields)
  const findAmount = (data: any, keys: string[]): string | null => {
      for (const key of keys) {
          if (data[key]) return data[key].toString();
      }
      return null;
  };

  // Helper to extract Coin Type from event type string (e.g. 0x...::pool::SwapEvent<0x...::sui::SUI, ...>)
  const extractCoinTypes = (type: string) => {
      const parts = type.split('<');
      if (parts.length < 2) return [];
      const inner = parts[1].replace('>', '');
      return inner.split(',').map(t => t.trim());
  };

  const activities = events.map((event, index) => {
    const type = event.type;
    const protocol = identifyProtocol(event.packageId);
    const data = event.parsedJson as any;

    // --- SWAP DETECTION ---
    if (type.toLowerCase().includes('swap')) {
       const coins = extractCoinTypes(type);
       const amountIn = findAmount(data, ['amount_in', 'amountIn', 'x_in', 'y_in']) || '0';
       const amountOut = findAmount(data, ['amount_out', 'amountOut', 'x_out', 'y_out']) || '0';
       
       // Try to guess which coin is which based on the field names if possible, for now simplify to A -> B
       // Often Swap<CoinA, CoinB> implies A is usually input, but it depends on direction (a_to_b)
       // This is a heuristic visualization
       const coinA = coins[0] ? coins[0].split('::').pop() : 'Token A';
       const coinB = coins[1] ? coins[1].split('::').pop() : 'Token B';

       return (
           <div key={index} className="flex flex-col gap-2 p-4 bg-slate-800/50 border border-slate-700 rounded-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50"></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <RefreshCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                Swap on {protocol ? protocol.name : 'DEX'}
                                {protocol && <span className="text-xs opacity-70">{protocol.icon}</span>}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{formatAddress(event.packageId)}</div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2 px-2">
                     <div className="text-right flex-1">
                         <div className="text-lg font-mono text-slate-300">-{formatBalance(amountIn)}</div>
                         <div className="text-xs text-slate-500 font-bold">{coinA}</div>
                     </div>
                     <ArrowRight className="w-4 h-4 text-slate-600" />
                     <div className="text-left flex-1">
                         <div className="text-lg font-mono text-green-400">+{formatBalance(amountOut)}</div>
                         <div className="text-xs text-green-500/70 font-bold">{coinB}</div>
                     </div>
                </div>
           </div>
       );
    }

    // --- LIQUIDITY / DEPOSIT ---
    if (type.toLowerCase().includes('deposit') || type.toLowerCase().includes('mint') || type.toLowerCase().includes('add_liquidity')) {
        const amount = findAmount(data, ['amount', 'token_amount', 'coin_amount']) || '0';
        return (
            <div key={index} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                 <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                     <Layers className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                     <div className="text-sm font-semibold text-slate-200">
                        Deposit / Add Liq
                        {protocol && <span className="ml-2 text-xs opacity-70 bg-slate-700 px-1.5 py-0.5 rounded">{protocol.name} {protocol.icon}</span>}
                     </div>
                     <div className="text-xs text-slate-500 font-mono">Amount: {formatBalance(amount)}</div>
                 </div>
            </div>
        );
    }
    
    // --- STAKING / UNSTAKE ---
    if (type.toLowerCase().includes('stake') || type.includes('Withdraw')) {
        const isUnstake = type.toLowerCase().includes('unbind') || type.toLowerCase().includes('withdraw');
         const amount = findAmount(data, ['amount', 'principal', 'reward']) || '0';
         
         return (
             <div key={index} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className={`p-2 rounded-lg ${isUnstake ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                      <Landmark className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-200">
                         {isUnstake ? 'Unstake / Withdraw' : 'Stake / Deposit'}
                         {protocol && <span className="ml-2 text-xs opacity-70 bg-slate-700 px-1.5 py-0.5 rounded">{protocol.name} {protocol.icon}</span>}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">Amount: {formatBalance(amount)}</div>
                  </div>
             </div>
         );
    }

    // Default: Generic Event Card
    return (
        <div key={index} className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <Box className="w-4 h-4 text-slate-500" />
                 <div className="flex flex-col">
                     <span className="text-sm text-slate-300 font-medium truncate max-w-[200px]" title={type.split('::').pop()}>{type.split('::').pop()}</span>
                     <span className="text-[10px] text-slate-500 font-mono">{protocol ? protocol.name : formatAddress(event.packageId)}</span>
                 </div>
             </div>
        </div>
    );
  });

  // State for "Show More"
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 5;
  const hasMore = activities.length > INITIAL_LIMIT;

  const visibleActivities = showAll ? activities : activities.slice(0, INITIAL_LIMIT);

  if (activities.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-2 px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Activity Feed</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
            {hasMore && (
                <button 
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                    {showAll ? 'Show Less' : `Show All (${activities.length})`}
                </button>
            )}
        </div>
        <div className="space-y-3">
            {visibleActivities}
        </div>
        {hasMore && !showAll && (
            <button 
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 border border-dashed border-slate-700 hover:border-slate-500 rounded-lg transition-all"
            >
                + {activities.length - INITIAL_LIMIT} more activities...
            </button>
        )}
    </div>
  );
}
