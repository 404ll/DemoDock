interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x030399fb88b772bcd0069811707d8bf7cf930b6d3354be8dfa3d3e3bedf82c8f",
        DemoPool:"0xd0e3dd74ab4d4aedec2d88cd0fde78c08c6c8b695c99d92e2fcf8797ea4714d3",
        State:"0x5d5eb46a4b56e2948745fa9b114232011598f37775a6f3a2c2ddf9778bcaf93f",
        AdminList:"0xd3689e352a11a62cab2c02218d283aeb011d0a78f9b40fa4cfc745db06d69b44",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}