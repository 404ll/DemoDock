"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Ship } from "lucide-react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import { getProfileByUser, getSuperAdmin } from "@/contracts/query"
import { useProfile } from "@/context/ProfileContext"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const account = useCurrentAccount()
  const { profileId, hasProfile } = useProfile()
  const [DemoAccount, setDemoAccount] = useState("")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const DemoAddress = async () => {
    // 重置状态，确保切换账户时UI正确更新
    setDemoAccount("")
    setIsSuperAdmin(false)
    try {
      if (!account || !account.address) {
        console.log("账户未连接或地址不可用")
        return
      }
      // 添加地址格式验证
      if (!account.address.startsWith("0x") || account.address.length < 42) {
        console.log(`无效的地址格式: ${account.address}`)
        return
      }

      try {
        // 先检查超级管理员权限
        const superAdminID = await getSuperAdmin(account.address)
        if (superAdminID) {
          setIsSuperAdmin(true)
          console.log("用户是超级管理员")
        } else {
          setIsSuperAdmin(false)
          console.log("用户不是超级管理员")
        }

        // 然后获取用户资料
        try {
          const profile = await getProfileByUser(account.address)
          if (profile) {
            setDemoAccount(String(profile.id.id))
            console.log("用户的个人资料:", profile.id.id)
          }
        } catch (profileError) {
          // 单独处理资料获取错误，不影响管理员状态
          console.log("获取用户资料失败，可能尚未创建:", profileError)
        }
      } catch (err) {
        console.error("检查用户状态失败:", err)
      }
    } catch (error) {
      console.error("获取用户信息过程中出错:", error)
    }
  }

  useEffect(() => {
    DemoAddress()
  }, [account]) // 添加依赖项，只在account变化时执行

  // 判断是否在首页
  const isHomePage = pathname === "/"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship className="h-6 w-6" />
          <Link href={account && DemoAccount ? "/explore" : "/"} className="text-xl font-bold">
            DemoDock
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* 首页显示锚点导航 */}
          {isHomePage && (
            <nav className="hidden md:flex gap-4 sm:gap-6 mr-4">
              <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
                Features
              </Link>
              <Link href="#tech" className="text-sm font-medium hover:underline underline-offset-4">
                Tech
              </Link>
              <Link href="#demo" className="text-sm font-medium hover:underline underline-offset-4">
                Demo
              </Link>
              <Link href="#team" className="text-sm font-medium hover:underline underline-offset-4">
                Team
              </Link>
            </nav>
          )}

          {/* 非首页且已登录显示功能导航 */}
          {account && !isHomePage && (
            <>
              <Button variant={pathname === "/explore" ? "default" : "ghost"} size="sm" asChild>
                <Link href="/explore">Explore</Link>
              </Button>

              {/* 只有有Profile的用户可以看到这些按钮 */}
              {hasProfile && (
                <>
                  <Button variant={pathname === "/create" ? "default" : "ghost"} size="sm" asChild>
                    <Link href="/create">Create</Link>
                  </Button>
                  <Button variant={pathname === "/profile" ? "default" : "ghost"} size="sm" asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>
                </>
              )}

              {/* 超级管理员总是可以看到Admin按钮，不管有没有Profile */}
              {isSuperAdmin && (
                <Button variant={pathname === "/admin" ? "default" : "ghost"} size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
            </>
          )}

          {/* 钱包连接按钮始终显示 */}
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
