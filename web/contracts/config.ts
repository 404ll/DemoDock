interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0xb47b95ffa9ff71db9d7799226e3b063946eeb4f54f4906cebd9a28d938dcef1e",
        DemoPool:"0xbb0bf0e5fc234e07cb1f3e7d2027622aed2cce69fecb0b3ef70092438bd304b1",
        State:"0x905bcfc2cf78d9effef68c7aa45b4dd4a17c7a0b1027071d6c06528cfd5eaf9c",
        AdminList:"0xaf0e072a8cf3ea0c2c4882594a61d5d659eff0bb8526319c3e607ed00491414d",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}