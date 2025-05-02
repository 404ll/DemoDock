export interface SponsorTxRequestBody {
    network: "mainnet" | "testnet";
    txBytes: string;
    sender: string;
    allowedAddresses?: string[];
}

export interface CreateSponsoredTransactionApiResponse {
    bytes: string;
    digest: string;
}

// public struct Demo has key {
//     id: UID,
//     name: String,
//     des: String,
//     visitor_list: vector<address>,
// }
export interface Demo {
    id:string;
    name:string;
    des:string;
    visitor_list:string[];
}

// public struct Profile has key {
//     id: UID,
//     name: String,
//     demos: vector<ID>,
// }
export interface Profile {
    id:string;
    name:string;
    demos:string[];
}
