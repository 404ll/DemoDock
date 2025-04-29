'use client'
import { ConnectButton } from '@mysten/dapp-kit'
import Image from 'next/image'

import { getUserProfile } from '@/contracts/query'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import { CategorizedObjects, calculateTotalBalance, formatBalance } from '@/utils/assetsHelpers'
import { Button } from "@/components/ui/button"
import { ArrowRight, Database, Key, Lock, Ship, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"


export default function Home() {
  const account = useCurrentAccount();
  const [userObjects, setUserObjects] = useState<CategorizedObjects | null>(null);
  const router = useRouter()
  const [hasAccount, setHasAccount] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  // 从localStorage或全局状态获取连接状态
  useEffect(() => {

    const checkUserAccount = () => {
      // 模拟检查用户账户状态
      return false
    }


    if (account) {
      const accountExists = checkUserAccount()
      setHasAccount(accountExists)

      // 如果已连接且有账户，重定向到explore
      if (accountExists) {
        router.push("/explore")
      }
    }
  }, [router])

  const handleGetStarted = () => {
    if (!account) {
      // 显示连接钱包弹窗
      setShowConnectDialog(true)
    } else if (!hasAccount) {
      // 如果已连接钱包但没有账户，跳转到创建账户页面
      router.push("/create-account")
    }
  }

  return (
  <div className="flex flex-col min-h-[calc(100vh-4rem)]">
     
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Where Projects Dock, and Ideas Rock
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A decentralized platform for Web3 developers to showcase and share their demo projects with secure
                  access control.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button onClick={handleGetStarted} size="lg">
                
                  Get Started

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-[250px] w-[250px] md:h-[350px] md:w-[350px] items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-70 blur-3xl" />
                </div>
                <Ship className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 连接钱包弹窗 */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>连接钱包</DialogTitle>
            <DialogDescription>
              请先连接您的钱包以继续使用DemoDock的功能。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Wallet className="h-12 w-12 text-primary mb-4" />
            <div className="mt-4">
              <ConnectButton />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Built on Walrus distributed storage and Seal encryption for secure, decentralized project sharing
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <Database className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">Decentralized Storage</h3>
              <p className="text-center text-muted-foreground">
                Store your demos on Walrus distributed storage for permanent availability
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <Lock className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">Access Control</h3>
              <p className="text-center text-muted-foreground">
                Set permissions and control who can access your project demos
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <Key className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-bold">On-chain Verification</h3>
              <p className="text-center text-muted-foreground">
                All access requests and approvals are recorded on-chain for transparency
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
