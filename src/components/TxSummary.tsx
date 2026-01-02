import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { CheckCircle2, XCircle, Box, Coins, FileText } from 'lucide-react';
import { formatAddress, formatBalance } from '../lib/utils';

interface TxSummaryProps {
  tx: SuiTransactionBlockResponse;
}

export function TxSummary({ tx }: TxSummaryProps) {
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
  const txKind = tx.transaction?.data.transaction;
  if (txKind?.kind === 'ProgrammableTransaction') {
      const moveCall = txKind.transactions.find((t: any) => 'MoveCall' in t);
      if (moveCall) {
          const mc = (moveCall as any).MoveCall;
          moveCallLabel = `${mc.module}::${mc.function}`;
      }
  }

  // Simple narrative generation
  const receivers = balanceChanges.filter(b => {
      const owner = b.owner as any;
      return BigInt(b.amount) > 0 && owner?.AddressOwner !== sender;
  });

  let narrative = "The transaction interact with the network.";
  if (moveCallLabel !== "Transaction") {
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
      const parts = type.split('::');
      if (parts.length >= 3) return parts.slice(2).join('::');
      return type;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Narrative Section */}
      <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <FileText className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-blue-100 mb-1">Summary</h3>
            <p className="text-blue-200/80 leading-relaxed font-mono text-sm">{narrative}</p>
        </div>
      </div>

      {/* Status Header */}
      <div className={`p-4 rounded-xl border ${status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {status === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          <div>
            <h3 className="font-semibold text-lg capitalize">{status}</h3>
            {error && <p className="text-sm opacity-80">{error}</p>}
          </div>
        </div>
        <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Gas Fee</div>
            <div className="font-mono font-medium text-slate-200">{gasInSui} SUI</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Changes */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Coins className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Balance Changes</h3>
          </div>
          
          {balanceChanges.length === 0 ? (
            <p className="text-slate-500 italic">No balance changes.</p>
          ) : (
            <div className="space-y-4">
              {balanceChanges.map((change, idx) => {
                const amount = BigInt(change.amount);
                const isPositive = amount > 0;
                const fmtAmount = formatBalance(amount);
                const ownerAddr = change.owner.hasOwnProperty('AddressOwner') ? (change.owner as any).AddressOwner : 'Object';
                
                return (
                  <div key={idx} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-800 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-slate-400 truncate w-32" title={ownerAddr}>
                            {formatAddress(ownerAddr)}
                        </span>
                        <span className={`font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : '-'}{fmtAmount} SUI
                        </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Object Changes */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-purple-400">
            <Box className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Object Updates</h3>
          </div>

          <div className="space-y-3">
             {published.length > 0 && (
                <div className="p-3 bg-slate-700/30 rounded-lg flex items-center justify-between">
                    <span className="text-slate-300">Published Packages</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">{published.length}</span>
                </div>
             )}
             {createdObjects.length > 0 && (
                <div className="space-y-2">
                    {createdObjects.map((obj, i) => (
                        <div key={i} className="p-3 bg-slate-700/30 rounded-lg flex items-center justify-between gap-2">
                            <span className="text-green-300 text-sm font-mono truncate" title={obj.objectType}>
                                + {formatObjectType(obj.objectType)}
                            </span>
                        </div>
                    ))}
                </div>
             )}
             {mutatedObjects.length > 0 && (
                 <div className="mt-4">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Mutated ({mutatedObjects.length})</div>
                    <div className="space-y-1">
                        {mutatedObjects.slice(0, 3).map((obj, i) => (
                             <div key={i} className="p-2 bg-slate-700/20 rounded border border-slate-700/50 text-slate-400 text-xs font-mono truncate">
                                {formatObjectType(obj.objectType)}
                             </div>
                        ))}
                        {mutatedObjects.length > 3 && (
                            <div className="text-xs text-slate-500 italic">...and {mutatedObjects.length - 3} more</div>
                        )}
                    </div>
                 </div>
             )}
             {objectChanges.length === 0 && <p className="text-slate-500 italic">No object changes.</p>}
          </div>
        </div>
      </div>
      
      {/* Sender Info */}
       <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between text-sm text-slate-400">
          <span>Sender</span>
          <span className="font-mono text-slate-300" title={sender}>{formatAddress(sender)}</span>
       </div>

    </div>
  );
}
