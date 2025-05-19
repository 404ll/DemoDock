// public struct Demo has key {
//     id: UID,
//     name: String,
//     des: String,
//     visitor_list: vector<address>,
// }
export interface Demo {
    id:{id:string};
    name:string;
    des:string;
    repo: String,
    demo_type: String,
    visitor_list:string[];
}

export interface Project {
    id: string
    name: string
    des: string
    repo: string
    type: string
    profile: string
    visitor_list:string[];
  }
  // public struct Profile has key {
//     id: UID,
//     name: String,
//     demos: vector<ID>,
// }
export interface Profile {
    id:{id:string};
    name:string;
    demos:string[];
}

export interface DisplayProfile {
    name:string; 
    demos:Demo[];
}


// public struct State has key {
//     id: UID,
//     profiles: Table<address, ID>,
// }

export interface State {
    id:string;
    profiles:ProfileCreated[];
}

// public struct ProfileCreated has copy, drop {
//     owner: address,
//     id: ID,
// }

export interface ProfileCreated {
    owner:string;
    id:string;
}

// public struct DemoCreated has copy, drop {
//     id: ID,
//     owner: address,
// }

export interface DemoCreated {
    id:string;
    owner:string;
}

// public struct DemoPool has key {
//     id: UID,
//     demos: Table<ID, address>,<demo_id,owner>
// }

export interface DemoPool {
    id:string;
    demos:DemoCreated[];
}

// public struct DemoRequest has copy, drop {
//     des: String,
//     demo_id: ID,
//     visitor: address,
// }
export interface DemoRequest {
    des:string;
    demo_id:string;
    visitor:string;
}

export interface SuperAdminCap { 
    id: {id: string};      
}

// 预定义的项目类型选项
export const PROJECT_TYPES = [
  { value: "socialfi", label: "SocialFi (Social Finance Application)" },
  { value: "defi", label: "DeFi (Decentralized Finance Protocol)" },
  { value: "nft", label: "NFT (Non-Fungible Token Project)" },
  { value: "gamefi", label: "GameFi (Blockchain-based Game)" },
  { value: "infra", label: "Infrastructure (RPC, Indexing, Storage, etc.)" },
  { value: "tool", label: "Developer Tooling & SDK" },
  { value: "dao", label: "DAO (Decentralized Autonomous Organization)" },
  { value: "wallet", label: "Wallet / Key Management" },
  { value: "layer2", label: "Layer 2 / Rollup Solution" },
  { value: "bridge", label: "Cross-chain Bridge / Interoperability" },
  { value: "identity", label: "Decentralized Identity (DID / SBT)" },
  { value: "security", label: "Security / Auditing / Monitoring" },
  { value: "indexer", label: "Data Indexing / Analytics" },
  { value: "launchpad", label: "Launchpad / Token Issuance Platform" },
  { value: "ai", label: "AI + Blockchain (e.g. AI agents, models onchain)" },
  { value: "other", label: "Other (Uncategorized)" },
];