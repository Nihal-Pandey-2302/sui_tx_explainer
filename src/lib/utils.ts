export function formatAddress(address: string | undefined): string {
  if (!address) return 'Unknown';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(amount: string | number | bigint): string {
    const val = BigInt(amount);
    const absVal = val < 0 ? -val : val;
    // 9 decimals for SUI
    const inSui = Number(absVal) / 1_000_000_000;
    
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(inSui);
}
