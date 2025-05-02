interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x6e97696aca8ae11518c40fd918baa00de56285228053c20592e0509240a7e5a6",
        DemoPool:"0xe610ee1b59ace1a953a15dd41798b2ab28e4547d48abed0651c4406bad4235ce",
        State:"0x7b7b3553508280ead64b6f07e89458c00d9b46822a44aa57e95af163c8813319",
        AdminList:"0x3d9176b6d741034477ce449c6e4724101ad2ef3822efb546e1931a87cb43a12a",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}