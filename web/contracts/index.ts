import { getFullnodeUrl, SuiClient,DevInspectResults } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getContractConfig } from "./config";

type NetworkVariables = ReturnType<typeof useNetworkVariables>;

function getNetworkVariables(network: Network) {
    return networkConfig[network].variables;
}

function createBetterTxFactory<T extends Record<string, unknown>>(
    fn: (tx: Transaction, networkVariables: NetworkVariables, params: T) => Transaction
) {
    return (params: T) => {
        const tx = new Transaction();
        const networkVariables = getNetworkVariables(network);
        return fn(tx, networkVariables, params);
    };
}

// function createBetterDevInspect<T extends Record<string, unknown>, R>(
//     fn: (tx: Transaction, networkVariables: ReturnType<typeof getNetworkVariables>) => Transaction,
//     parseResult: (res: DevInspectResults) => R | null
//   ) {
//     return async (): Promise<R | null> => {
//       const tx = new Transaction();
//       const networkVariables = getNetworkVariables(network);
//       const populatedTx = fn(tx, networkVariables);
  
//       const res = await suiClient.devInspectTransactionBlock({
//         transactionBlock: populatedTx,
//         sender: '0x0',
//       });
  
//       return parseResult(res);
//     };
//   }
type Network = "mainnet" | "testnet"

const network = (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

const { networkConfig, useNetworkVariables } = createNetworkConfig({
    testnet: {
        url: getFullnodeUrl("testnet"),
        variables: getContractConfig("testnet"),
    },
    mainnet: {
        url: getFullnodeUrl("mainnet"), 
        variables: getContractConfig("mainnet"),
    }
});

// 创建全局 SuiClient 实例
const suiClient = new SuiClient({ url: networkConfig[network].url });

export { getNetworkVariables, networkConfig, network, suiClient, createBetterTxFactory, useNetworkVariables };
export type { NetworkVariables };

