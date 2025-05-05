interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x7e63dca7b7db0eb1ecf473836c61b09a8da71cd345ca497bd6be93ca11694d75",
        DemoPool:"0x63be142b5757beb9eefbc59d7ab396bc2030d004418d78552c9110c3a6250cbd",
        State:"0x82d9058459824a447b2386d17ccfca83c71f328be110f8199f90e6cbd07de63c",
        AdminList:"0x1c2837f15b6973523e15d6d59b538c212f50887ed34d9dae1174e8640b574c44",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}