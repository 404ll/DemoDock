"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import { getProfileByUser } from '@/contracts/query';
import { useCurrentAccount } from '@mysten/dapp-kit';

const ProfileContext = createContext({
  profileId: "",
  hasProfile: false,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }) {
  const [profileId, setProfileId] = useState("");
  const account = useCurrentAccount();
  
  const refreshProfile = async () => {
    if (!account?.address) return;
    
    try {
      const profile = await getProfileByUser(account.address);
      if (profile) {
        setProfileId(String(profile.id.id));
      } else {
        setProfileId("");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setProfileId("");
    }
  };
  
  useEffect(() => {
    refreshProfile();
  }, [account]);
  
  return (
    <ProfileContext.Provider value={{ 
      profileId, 
      hasProfile: !!profileId, 
      refreshProfile 
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);