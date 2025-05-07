interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x4fa82a5f92a9eec6c658dd49edb91b973132ce0039ac186460af4dfea717862b",
        DemoPool:"0x0897c9347be1a5ae71ba25d2a76dbf17b52bd209ef4c80cf7037c15636ae14af",
        State:"0x27f71c857194984006223f1ba7f14b70a1fa2b2128634d68c11cbab65761ea25",
        AdminList:"0xe9081a505a803ad842facadc77ff7e052fdfbc1c8fb562a0177cdb10174c9057",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}