import { isValidSuiAddress } from "@mysten/sui/utils";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { suiClient ,networkConfig,createBetterTxFactory} from "./index";
import { useSuiClient } from "@mysten/dapp-kit";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";

export   const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;

export const getUserProfile = async (address: string): Promise<CategorizedObjects> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  let hasNextPage = true;
  let nextCursor: string | null = null;
  let allObjects: SuiObjectResponse[] = [];

  while (hasNextPage) {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
      },
      cursor: nextCursor,
    });

    allObjects = allObjects.concat(response.data);
    hasNextPage = response.hasNextPage;
    nextCursor = response.nextCursor ?? null;
  }

  return categorizeSuiObjects(allObjects);
};

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

//query all Demos
export const getAllDemo = async () => {

};

//query all Profiles
export const getAllProfile = async () => {

};