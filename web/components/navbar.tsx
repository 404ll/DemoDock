"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Ship, User } from "lucide-react"
import { cn } from "@/utils"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { ConnectButton } from '@mysten/dapp-kit'
import { getProfileByUser,getSuperAdmin } from '@/contracts/query'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const account = useCurrentAccount();
  const [DemoAccount, setDemoAccount] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const DemoAddress = async () => {
    // 重置状态，确保切换账户时UI正确更新
    setDemoAccount("");
    setIsSuperAdmin(false);
    try {
      if (account) {  // 确保 account 存在
        const profile = await getProfileByUser(account.address);
        const isSuperAdmin = await getSuperAdmin(account.address);
        if (isSuperAdmin) {
          setIsSuperAdmin(true);
          console.log("用户是超级管理员");
        }else{  
          setIsSuperAdmin(false);
          console.log("用户不是超级管理员");
        }
        if (profile) {  // 确保 profile 存在
          setDemoAccount(String(profile.id.id));
          console.log("用户的个人资料:", profile.id.id);
          console.log("用户的个人:", String(profile.id.id));
        } 
      }
     
    } catch (error) {
      console.error("获取用户资料失败:", error);
    }
  }

  useEffect(() => {
    DemoAddress();
 }, [account]); // 添加依赖项，只在account变化时执行

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship className="h-6 w-6" />
          <Link href={account && DemoAccount ? "/explore" : "/"} className="text-xl font-bold">
            DemoDock
          </Link>
        </div>

        {account && DemoAccount&&(
          <nav className="hidden md:flex gap-6">
            <Link
              href="/explore"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/explore" ? "text-primary" : "text-muted-foreground",
              )}
            >
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {account ? (
            <>
              {/* 超级管理员总是可以看到Admin按钮，不管有没有Profile */}
              {isSuperAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}

              {/* 只有有Profile的用户可以看到这些按钮 */}
              {DemoAccount && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/create">Create</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>
                </>
              )}
              <ConnectButton />
            </>
          ) : (
            <ConnectButton />
          )}
        </div>
      </div>
    </header>
  )

}
