import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

export const getTransaction = async (digest: string) => {
  return await suiClient.getTransactionBlock({
    digest,
    options: {
      showEffects: true,
      showInput: true,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    },
  });
};

export const isValidDigest = (digest: string) => {
  // Simple check for 32 bytes base58 (approx length) or standard hex/base64 formats used in Sui
  // Sui digests are typically base58 encoded and 32 bytes length (around 43-44 chars).
  // A loose regex is often enough for UI validation.
  return /^[a-zA-Z0-9]{32,64}$/.test(digest);
};
