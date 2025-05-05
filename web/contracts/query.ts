import { isValidSuiAddress } from "@mysten/sui/utils";
import { SuiObjectResponse, SuiParsedData } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { suiClient ,networkConfig,createBetterTxFactory} from "./index";
import { useSuiClient } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { profile } from "console";
import { Demo, DemoPool, Profile, ProfileCreated, State } from "@/types";
import { Move } from "lucide-react";
import { get } from "http";

export   const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;


export const getEncryptedObject=async(id:string,arrayBuffer:ArrayBuffer)=>{
  const packageId =networkConfig.testnet.variables.Package;
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });
  const { encryptedObject } = await sealClient.encrypt({
    threshold: 2,
    packageId,
    id,
    data: new Uint8Array(arrayBuffer),
  });

  return encryptedObject;
}

//query DemoPool
export const getDemoPool = async () => {
  const events = await suiClient.queryEvents({
    query:{
      MoveEventType: `${networkConfig.testnet.variables.Package}::demo::DemoCreated`,
    }
  });
  const pool: DemoPool = {
    id: networkConfig.testnet.variables.DemoPool,
    demos:[]
  }
  events.data.map((event) => {
    const eventContent = event.parsedJson as ProfileCreated;
    pool.demos.push(eventContent);
  });
  return pool;
}


//query demo
export const getdemoByid = async(demo_id:string)=>{
  if (!isValidSuiAddress(demo_id)) {
    throw new Error("Invalid Sui address");
  }
  const DemoContent = await suiClient.getObject({
    id: demo_id,
    options: {
      showContent: true,
    },
  });
  if (!DemoContent) {
    throw new Error("Demo not found");
  }
  const profileParseData = DemoContent.data?.content as SuiParsedData;
  if(!('fields' in profileParseData)){
    throw new Error("Demo not found");
  }
  const demo = profileParseData.fields as unknown as Demo;
  if(!profile) {
    throw new Error("Demo not found");
  }
  return demo;
}

//query all Demos
export const getAllDemo = async () => {
  const pool = await getDemoPool();
  const demoPromises = pool.demos.map(async (oneDemo)=>{
    const demo = getdemoByid(oneDemo.id);
    return demo
  })
  const demos = await Promise.all(demoPromises);
  return demos;
};

//query State
export const getState = async () => {
  const events = await suiClient.queryEvents({
    query:{
      MoveEventType: `${networkConfig.testnet.variables.Package}::profile::ProfileCreated`,
    }
  });
  const state : State = {
    id: networkConfig.testnet.variables.State,
    profiles: [],
  }
  events.data.map((event) => {
    const eventContent = event.parsedJson as ProfileCreated;
    state.profiles.push(eventContent);
  });
  return state;
}


//query all Profiles
export const getAllProfile = async () => {
  const state = await getState();
  const profilePromises = state.profiles.map(async (oneProfile) => {
    const profile = await getProfile(oneProfile.id);
    return profile;
  });

  const profiles = await Promise.all(profilePromises);
  return profiles;
};


//获取当前用户的所有Demo
export const getUserDemo = async (address: string): Promise<Demo[]> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  const demosContent = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${networkConfig.testnet.variables.Package}::demo::Demo`,
    },
    options: {
      showContent: true,
    },
  });

  const demos: Demo[] = demosContent.data
    .map((demo) => {
      const parsedDemoData = demo.data?.content;
      if (!parsedDemoData || !("fields" in parsedDemoData)) {
        return null;
      }
      const demoData = parsedDemoData.fields as SuiParsedData;
      return demoData as unknown as Demo;
    })
    .filter((item): item is Demo => item !== null);

  return demos;
};



///Profile

//获取当前用户的Profile
export const getProfile = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  const profileContent = await suiClient.getObject({
    id: address,
    options: {
      showContent: true,
    },
  });
  if (!profileContent) {
    throw new Error("Profile not found");
  }
  const profileParseData = profileContent.data?.content as SuiParsedData;
  if(!('fields' in profileParseData)){
    throw new Error("Profile not found");
  }
  const profile = profileParseData.fields as unknown as Profile;
  if(!profile) {
    throw new Error("Profile not found");
  }
  return profile;
};

//public fun create_profile(name: String, state: &mut State, ctx: &mut TxContext) {
//   let profile = Profile {
//     id: object::new(ctx),
//     name: name,
//     demos: vector::empty(),
// };

// let profile_id = profile.id.to_inner();
// let owner = ctx.sender();
// assert!(!table::contains(&state.profiles, owner), ERROR_PROFILE_EXISTS);
// table::add(&mut state.profiles, owner, profile_id);

// emit(ProfileCreated {
//     id: profile_id,
//     name: profile.name,
// });

// transfer::transfer(profile, ctx.sender());
// }

export const createProfile = createBetterTxFactory<{ name: string;}>((tx, networkVariables, { name }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "profile",
    function: "create_profile",
    arguments: [tx.pure.string(name), tx.object(networkVariables.State)]
});
  return tx;
});

// public fun add_demo_to_profile(profile: &mut Profile, demo: ID, _ctx: &mut TxContext) {
//   assert!(!vector::contains(&profile.demos, &demo), ERROR_PROFILE_NOT_EXISTS);
//   vector::push_back(&mut profile.demos, demo);
// }

export const addDemoToProfile = createBetterTxFactory<{ profile: string; demo: string;}>((tx, networkVariables, { profile, demo }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "profile",
    function: "add_demo_to_profile",
    arguments: [tx.object(profile), tx.object(demo)]
});
  return tx;
});

///Admin Functions

// public fun add_admin(
//   _super_admin: &SuperAdminCap,
//   admin_list: &mut AdminList,
//   account: address,
// ) {
//   admin_list.admin.insert(account);
// }

export const addAdmin = createBetterTxFactory<{account: string;}>((tx, networkVariables, { account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "admin",
    function: "add_admin",
    arguments: [tx.object(networkVariables.AdminList), tx.pure.address(account)]
});
  return tx;
});

// public fun remove_admin(
//   _super_admin: &SuperAdminCap,
//   admin_list: &mut AdminList,
//   account: address,
// ) {
//   admin_list.admin.remove(&account);
// }

export const removeAdmin = createBetterTxFactory<{account: string;}>((tx, networkVariables, { account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "admin",
    function: "remove_admin",
    arguments: [tx.object(networkVariables.AdminList), tx.pure.address(account)]
});
  return tx;
});

///Demo Functions

// entry fun create_demo_entry(
//   name: String,
//   des: String,
//   pool: &mut DemoPool,
//   profile: &mut Profile,
//   ctx: &mut TxContext,
// ) {
//   transfer::transfer(create_demo(name, des, pool, profile, ctx), ctx.sender());
// }

export const createDemo = createBetterTxFactory<{ name: string; des: string,profile:string;}>((tx, networkVariables, { name, des,profile }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "create_demo_entry",
    arguments: [tx.pure.string(name), tx.pure.string(des), tx.object(networkVariables.DemoPool), tx.object(profile)]
});
  return tx;
});

// public fun publish(demo: &mut Demo, cap: &Cap, blob_id: String) {
//   assert!(cap.demo_id == object::id(demo), EInvalidCap);
//   df::add(&mut demo.id, blob_id, MARKER);
// }

export const publishDemo = createBetterTxFactory<{ demo: string; cap: string; blob_id: string;}>((tx, networkVariables, { demo, cap, blob_id }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "publish",
    arguments: [tx.object(demo), tx.object(cap), tx.pure.string(blob_id)]
});
  return tx;
});

// public fun add_visitor_by_user(demo: &mut Demo, cap: &Cap, account: address) {
//   assert!(cap.demo_id == object::id(demo), EInvalidCap);
//   assert!(!demo.visitor_list.contains(&account), EDuplicate);
//   demo.visitor_list.push_back(account);
// }
export const addVisitorByUser = createBetterTxFactory<{ demo: string; cap: string; account: string;}>((tx, networkVariables, { demo, cap, account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "add_visitor_by_user",
    arguments: [tx.object(demo), tx.object(cap), tx.pure.address(account)]
});
  return tx;
});

// public fun remove_visitor_by_user(demo: &mut Demo, cap: &Cap, account: address) {
//   assert!(cap.demo_id == object::id(demo), EInvalidCap);
//   demo.visitor_list = demo.visitor_list.filter!(|x| x != account);
// }
export const removeVisitorByUser = createBetterTxFactory<{ demo: string; cap: string; account: string;}>((tx, networkVariables, { demo, cap, account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "remove_visitor_by_user",
    arguments: [tx.object(demo), tx.object(cap), tx.pure.address(account)]
});
  return tx;
});

// public fun request_demo(demo: &mut Demo, des: String, ctx: &mut TxContext) {
//   let visitor = ctx.sender();
//   assert!(!demo.visitor_list.contains(&visitor), ERROR_PROFILE_EXISTS);
//   emit(DemoRequest {
//       des: des,
//       demo_id: demo.id.to_inner(),
//       visitor: visitor,
//   });
// }
export const requestDemo = createBetterTxFactory<{ demo: string; des: string;}>((tx, networkVariables, { demo, des }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "request_demo",
    arguments: [tx.object(demo), tx.pure.string(des)]
});
  return tx;
});

// public fun approve_internal(
//   caller: address,
//   demo: &Demo,
//   id: vector<u8>,
//   adminlist: &AdminList,
// ): bool {
//   let namespace = namespace(demo);
//   if (!is_prefix(namespace, id)) {
//       return false
//   };
//   let admin_list = get_admin_addresses(adminlist);
//   if (admin_list.contains(&caller)) {
//       return true
//   } else {
//       demo.visitor_list.contains(&caller)
//   }
// }
export const approveInternal = createBetterTxFactory<{ caller: string; demo: string; id: string;}>((tx, networkVariables, { caller, demo, id}) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "demo",
    function: "approve_internal",
    arguments: [tx.pure.address(caller), tx.object(demo), tx.pure.string(id), tx.object(networkVariables.AdminList)]
});
  return tx;
});