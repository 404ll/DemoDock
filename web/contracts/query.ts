import { isValidSuiAddress } from "@mysten/sui/utils";
import { SuiObjectResponse, SuiParsedData } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { suiClient ,networkConfig,createBetterTxFactory} from "./index";
import { useSuiClient } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { bcs } from '@mysten/sui/bcs';
import { Demo, DemoPool, Profile, ProfileCreated, State,DemoRequest } from "@/types";

export const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;

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
  console.log("Encrypted Object:", encryptedObject);

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
  const demoParseData = DemoContent.data?.content as SuiParsedData;
  if(!('fields' in demoParseData)){
    throw new Error("Demo not found");
  }
  const demo = demoParseData.fields as unknown as Demo;
  if(!demo) {
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
export const getUserDemo = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  const profile = await getProfileByUser(address);
  if (!profile) {
    throw new Error("Profile is null");
  }
  const demoPromises = profile.demos.map(async (oneDemo) => {
    const demo = await getdemoByid(oneDemo);
    return demo;
  });
  const demos = await Promise.all(demoPromises);
  return demos;
};



///Profile

//通过Profile_id的获取Profile
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


//通过用户地址获得Profile
export const getProfileByUser = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  
  const profile = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${networkConfig.testnet.variables.Package}::profile::Profile`,
    },
    options: {
      showContent: true,
    },
  });

  // 处理没有找到 Profile 的情况
  if (!profile.data || profile.data.length === 0) {
    return null; 
  }

  // 直接获取第一个对象（因为确定只有一个）
  const profileObj = profile.data[0];
  
  // 确保有内容
  if (!profileObj.data?.content || !("fields" in profileObj.data.content)) {
    throw new Error("Invalid profile data structure");
  }

  // 提取并返回 Profile 数据
  const profileContent = profileObj.data.content;
  const profileData = profileContent.fields as unknown as Profile;
  
  return profileData
}


//通过demo获取capId
export const getCapByDemoId = async (address: string,id: string) => {
      const res = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${networkConfig.testnet.variables.Package}::demo::Cap`,
        },
      });
      
      console.log("CapId",res.data);
      const capId = res.data
      .map((obj) => {
        const fields = (obj!.data!.content as { fields: any }).fields;
        return {
          id: fields?.id.id,
          demo_id: fields?.demo_id,
        };
      })
      .filter((item) => item.demo_id === id)
      .map((item) => item.id) as string[];
      console.log("CapId",capId);
      return capId[0];
};

export const getDemoByProfile = async (profile: Profile) => {
  const demoPromises = profile.demos.map(async (oneDemo) => {
    const demo = await getdemoByid(oneDemo);
    return demo;
  });
  const demos = await Promise.all(demoPromises);
  return demos;

}

export const getFeedDataByDemoId = async (id: string) => {
  const demo = await suiClient.getObject({
    id: id!,
    options: { showContent: true },
  });
  const encryptedObjects = await suiClient
    .getDynamicFields({
      parentId: id!,
    })
    .then((res) => res.data.map((obj) => obj.name.value as string));

  const fields = (demo.data?.content as { fields: any })?.fields || {};
  const feedData = {
    DemoId: id!,
    DemoName: fields?.name,
    blobIds: encryptedObjects,
  };
  return feedData;
}
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
  const adminlist = tx.moveCall({
    package: networkVariables.Package,
    module: "profile",
    function: "create_profile",
    arguments: [tx.pure.string(name), tx.object(networkVariables.State)]
});
  console.log("adminlist",adminlist);
  return tx;
});

//返回是否是超级管理员
export const getSuperAdmin = async (address:string) => {

  interface SuperAdminCap  {
    id: {id:string};
  } 
  
  const superadmin = await suiClient.getOwnedObjects({
    owner: address,
    options: {
      showContent: true,
      showType: true,
    },
    filter: {
      StructType: `${networkConfig.testnet.variables.Package}::admin::SuperAdminCap`,
    },
  });

  // 处理没有找到 Profile 的情况
  if (!superadmin.data || superadmin.data.length === 0) {
    return null; 
  }

  // 直接获取第一个对象（因为确定只有一个）
  const adminObj = superadmin.data[0];
  
  // 确保有内容
  if (!adminObj.data?.content || !("fields" in adminObj.data.content)) {
    throw new Error("Invalid profile data structure");
  }

  // 提取并返回 Profile 数据
  const suiperAdmin = adminObj.data.content;
  const suiperAdminCap = suiperAdmin.fields as unknown as SuperAdminCap;
  console.log("superadmin",suiperAdminCap.id.id);
  return suiperAdminCap.id.id

}

///Admin Functions
export const getAdminList = async (): Promise<string[]> => {
  try {
    // 获取 AdminList 对象
    const adminListObj = await suiClient.getObject({
      id: networkConfig.testnet.variables.AdminList,
      options: {
        showContent: true,
      },
    });

    // 检查返回的数据是否包含 content 和 fields
    if (!adminListObj.data?.content || !("fields" in adminListObj.data.content)) {
      throw new Error("Invalid AdminList structure");
    }

    const adminListParseData = adminListObj.data?.content as SuiParsedData;

    // 解析 adminList
    if ('fields' in adminListParseData) {
      const adminList = adminListParseData.fields as unknown as { admin: { type: string, fields: { [key: string]: string[] } }, id: { id: string } };

      if (adminList && adminList.admin) {
        // 获取管理员地址列表
        const adminAddresses = adminList.admin.fields?.contents as string[]; 
        console.log("adminAddresses",adminAddresses);
        return adminAddresses;
      } else {
        throw new Error("Invalid AdminList structure");
      }
    } else {
      throw new Error("Invalid AdminList structure");
    }

  } catch (error) {
    console.error("Error fetching admin list:", error);
    throw error;
  }
};

//获取单个管理员接收的申请
export const getAdminApplication = async (address:string):Promise<DemoRequest[]> => {
  const events = await suiClient.queryEvents({
    query:{
      MoveEventType: `${networkConfig.testnet.variables.Package}::demo::DemoRequest`,
    }
  });
  console.log("events",events.data);
  const requests: DemoRequest[] = [];
  for (const event of events.data) {
    const requestEvent = event.parsedJson as DemoRequest;
    console.log("requestEvent",requestEvent);
    try {
      // 获取demo对象
      // const owner = await getDemoOwner(requestEvent.demo_id);
      
      // 检查demo所有者是否与传入地址匹配
      // if (owner === address) {
        requests.push(requestEvent);
      // }
    } catch (error) {
      console.error(`处理请求事件时出错: ${error}`);
      // 继续处理下一个事件
    }
  }
  
  return requests;
}

//获取demo的所有者
// public fun get_demo_owner(demo_id: ID, pool: &DemoPool): address {
//   assert!(table::contains(&pool.demos, demo_id), EDEMO_NOT_EXISTS);
//   let address = table::borrow(&pool.demos, demo_id);
//   *address
// }
export const getDemoOwner = async (demo_id:string):Promise<string> => {
  const tx = new Transaction();
  tx.moveCall({
    package: networkConfig.testnet.variables.Package,
    module: "demo",
    function: "get_demo_owner",
    arguments: [tx.pure.string(demo_id), tx.object(networkConfig.testnet.variables.DemoPool)]
  })
   // @ts-ignore
   const res: DevInspectResults =
   await suiClient.devInspectTransactionBlock({
     transactionBlock: tx,
     sender: normalizeSuiAddress('0x0'),
   });
   console.log("res",bcs.Address.parse(
    new Uint8Array(res?.results[0]?.returnValues[0][0]),
  ));
   return bcs.Address.parse(
    new Uint8Array(res?.results[0]?.returnValues[0][0]),
  );
}

// public fun add_admin(
//   _super_admin: &SuperAdminCap,
//   admin_list: &mut AdminList,
//   account: address,
// ) {
//   admin_list.admin.insert(account);
// }

export const addAdmin = createBetterTxFactory<{superAdminCap:string,account: string;}>((tx, networkVariables, { superAdminCap,account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "admin",
    function: "add_admin",
    arguments: [tx.object(superAdminCap),tx.object(networkVariables.AdminList), tx.pure.address(account)]
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

export const removeAdmin = createBetterTxFactory<{superAdminCap:string,account: string;}>((tx, networkVariables, {superAdminCap, account }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "admin",
    function: "remove_admin",
    arguments: [tx.object(superAdminCap),tx.object(networkVariables.AdminList), tx.pure.address(account)]
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
export const addVisitorByUser = createBetterTxFactory<{ demo: string; cap: string;account:string;}>((tx, networkVariables, { demo, cap,account }) => {
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
export const removeVisitorByUser = createBetterTxFactory<{ demo: string; cap: string; account: string; }>((tx, networkVariables, { demo, cap, account }) => {
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

// public fun get_admin_addresses(admin_list: &AdminList): vector<address> {
//   vec_set::into_keys(admin_list.admin)
// }



