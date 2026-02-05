import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { ArrowRight } from 'lucide-react';
import { formatAddress } from '../lib/utils';
import { identifyProtocol } from '../lib/protocols';

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

        {/* PTB Flow or Action */}
        <div className="flex-1 flex flex-col gap-4 relative w-full overflow-x-auto p-4">
             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 -z-10"></div>
             
             {/* If Programmable Transaction, show commands */}
             {tx.transaction?.data.transaction?.kind === 'ProgrammableTransaction' ? (
                 <div className="w-full overflow-x-auto custom-scrollbar pb-6 px-4 md:px-8">
                    <div className="flex items-center gap-4 min-w-max">
                     {(tx.transaction.data.transaction as any).transactions.map((cmd: any, i: number, arr: any[]) => {
                         let label = "Command";
                         let icon = "⚡";
                         let detail = "";
                         let color = "bg-slate-800 border-slate-700";

                         if ('MoveCall' in cmd) {
                             const mc = cmd.MoveCall;
                             const proto = identifyProtocol(mc.package);
                             if (proto) {
                                 label = proto.name;
                                 icon = proto.icon;
                             } else {
                                 label = "MoveCall";
                                 icon = "📦";
                             }
                             detail = mc.function;
                             color = "bg-blue-900/40 border-blue-500/50 text-blue-200";
                         } else if ('SplitCoins' in cmd) {
                             label = "SplitCoins";
                             icon = "✂️";
                             color = "bg-yellow-900/40 border-yellow-500/50 text-yellow-200";
                         } else if ('MergeCoins' in cmd) {
                             label = "MergeCoins";
                             icon = "🔗";
                             color = "bg-orange-900/40 border-orange-500/50 text-orange-200";
                         } else if ('TransferObjects' in cmd) {
                             label = "Transfer";
                             icon = "➡️";
                             color = "bg-green-900/40 border-green-500/50 text-green-200";
                         } else if ('Publish' in cmd) {
                             label = "Publish";
                             icon = "upl";
                             color = "bg-purple-900/40 border-purple-500/50 text-purple-200";
                         }

                         return (
                             <div key={i} className="flex items-center gap-4 animate-in zoom-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 150}ms` }}>
                                 <div className={`relative flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border ${color} shadow-lg min-w-[100px]`}>
                                     <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
                                     <div className="text-xl">{icon}</div>
                                     {detail && <div className="text-[10px] font-mono max-w-[120px] truncate opacity-80" title={detail}>{detail}</div>}
                                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                                         {i}
                                     </div>
                                 </div>
                                 
                                 {/* Arrow as separate flex item */}
                                 {i < arr.length - 1 && (
                                     <ArrowRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                                 )}
                             </div>
                         );
                     })}
                 </div>
                 </div>
             ) : (
                <div className="flex flex-col items-center relative">
                    <div className="z-10 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-xs font-mono text-slate-300 shadow-lg">
                        EXECUTE
                    </div>
                </div>
             )}
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
