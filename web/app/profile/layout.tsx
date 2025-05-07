"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bell, FileText, Key, Settings, User } from "lucide-react"
import { getProfileByUser } from '@/contracts/query'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { formatAddress } from "@mysten/sui/utils"
import { useEffect, useState } from "react"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const account = useCurrentAccount();
  const [name, setName] = useState("*");

  const navItems = [
    {
      title: "My Projects",
      href: "/profile",
      icon: FileText,
      exact: true,
    },
    {
      title: "Access Requests",
      href: "/profile/access-requests",
      icon: Key,
    },
    
  ]
  const getProfile=async()=>{
    if (!account?.address) { // Add guard for account.address
      setName("*"); // Reset name if address is not available
      return;
    }
    try{
        const profile=await getProfileByUser(account.address) // Use account.address safely
        setName(profile?.name ?? "*"); // Use nullish coalescing for default name
          }catch(e){
            console.error("检查用户状态失败:", e);
            setName("*"); // Reset name on error
          }
  }
  useEffect(() => {
    // getProfile will be called, and it now has an internal check for account.address
    getProfile();
 }, [account, getProfile]); // Added getProfile to dependency array as it's defined outside and used in effect

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center border-b pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {account?.address ? formatAddress(account.address) : "No address connected"}
          </p>
        </div>
      </div>

      <div className="mb-6 flex overflow-auto">
        <nav className="flex space-x-4 border-b w-full">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "border-primary text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
