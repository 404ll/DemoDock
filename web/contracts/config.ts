interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x0059efb9e34174f251ec392e2cb178b423b26477c34171d2c8d77aaeead66b48",
        DemoPool:"0x322169917358a4e5f403f6d53e44973dba450b6047c0cd6cd5f32c192501368d",
        State:"0x5727a22e8c887ecaf4a87b07c362547788d96d8391b27ce40c96a9371f6ece02",
        AdminList:"0xad3e67cb955ac09c3f015b8f422243253385fbbf4f5a0f9833a2a45060c3e181",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}