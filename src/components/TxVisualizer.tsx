import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { ArrowRight } from 'lucide-react';
import { formatAddress } from '../lib/utils';

interface TxVisualizerProps {
  tx: SuiTransactionBlockResponse;
}

export function TxVisualizer({ tx }: TxVisualizerProps) {
    // A simplified visualization: Sender -> [Transaction] -> Changed Objects / Receivers
    const sender = tx.transaction?.data.sender;
    const balanceChanges = tx.balanceChanges || [];
    
    // Find receivers (positive balance changes that are NOT the sender)
    const receivers = balanceChanges
        .filter(b => {
            const owner = b.owner as any;
            return BigInt(b.amount) > 0 && owner?.AddressOwner !== sender;
        })
        .map(b => (b.owner as any).AddressOwner);

    const uniqueReceivers = Array.from(new Set(receivers));

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {/* Sender Node */}
        <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                S
            </div>
            <div className="text-xs font-mono text-slate-400 max-w-[100px] truncate" title={sender}>{formatAddress(sender)}</div>
            <div className="text-sm font-medium text-slate-300">Sender</div>
        </div>

        {/* Arrow & Tx Action */}
        <div className="flex-1 flex flex-col items-center relative">
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 absolute top-1/2 -translate-y-1/2 z-0"></div>
            <div className="z-10 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-xs font-mono text-slate-300 shadow-lg">
                EXECUTE
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 mt-1" />
        </div>

        {/* Receivers/Network Node */}
        <div className="flex flex-col items-center gap-4">
             {uniqueReceivers.length > 0 ? (
                 uniqueReceivers.map((addr, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="w-12 h-12 rounded-full bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold">
                            R{i + 1}
                        </div>
                         <div className="text-xs font-mono text-slate-400 max-w-[80px] truncate" title={addr}>{formatAddress(addr)}</div>
                    </div>
                 ))
             ) : (
                <div className="flex flex-col items-center gap-2">
                     <div className="w-16 h-16 rounded-full bg-slate-700/50 border-2 border-slate-600 flex items-center justify-center text-slate-400">
                        Network
                    </div>
                    <div className="text-sm font-medium text-slate-400">Contract / State</div>
                </div>
             )}
        </div>
    </div>
  );
}
