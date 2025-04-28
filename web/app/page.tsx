'use client'
import { ConnectButton } from '@mysten/dapp-kit'
import Image from 'next/image'
import { getUserProfile } from '@/contracts/query'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import { CategorizedObjects, calculateTotalBalance, formatBalance } from '@/utils/assetsHelpers'

export default function Home() {
  const account = useCurrentAccount();
  const [userObjects, setUserObjects] = useState<CategorizedObjects | null>(null);



  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
       
        <ConnectButton />
      </header>
     
    </div>
  );
}
