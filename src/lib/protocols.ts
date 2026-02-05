export const KNOWN_PROTOCOLS: Record<string, { name: string; icon: string; url: string }> = {
    // Sui Framework
    '0x0000000000000000000000000000000000000000000000000000000000000002': {
        name: 'Sui Framework',
        icon: '💧',
        url: 'https://docs.sui.io/'
    },
    '0x0000000000000000000000000000000000000000000000000000000000000003': {
        name: 'Sui System',
        icon: '⚙️',
        url: 'https://docs.sui.io/'
    },
    // DeepBook (Mainnet)
    '0xdee9': { // Prefix match often used in checks, but full ID preferred
         name: 'DeepBook',
         icon: '📘',
         url: 'https://sui.io/deepbook'
    },
     // Cetus (Mainnet Config - Example)
    '0x1eabed72c53feb3805120a081dc15963c20c1d28810123282f4e15e855c0e100': {
        name: 'Cetus CLMM',
        icon: '🐳',
        url: 'https://www.cetus.zone/'
    },
    // TurboOS / Turbos
    '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1': {
        name: 'Turbos Finance',
        icon: '⚡',
        url: 'https://turbos.finance/'
    }
    // Add more here
};

export function identifyProtocol(packageId: string): { name: string; icon: string } | null {
    // Exact match
    if (KNOWN_PROTOCOLS[packageId]) {
        return KNOWN_PROTOCOLS[packageId];
    }
    // DeepBook often uses 0xdee9 as prefix in shortened form, but full ID is 
    // 0xdee9... usually. Just a heuristic.
    if (packageId.startsWith('0xdee9')) {
        return { name: 'DeepBook', icon: '📘' };
    }
    return null;
}
