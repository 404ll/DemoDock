"use client"

import type React from "react"

import { ConnectButton } from "@mysten/dapp-kit"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Database, Key, Lock, Ship, Wallet, Globe, LineChart, Github, Play, Shield, HardDrive, Code, User, ChevronDown, MousePointer } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Navbar } from "@/components/navbar"

// 导入查询函数
import { getProfileByUser } from "@/contracts/query"
import type { CategorizedObjects } from "@/utils/assetsHelpers"

// 定义 FeatureCard 组件接口
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

// 添加 FeatureCard 组件定义
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center space-y-4 rounded-lg border p-8 shadow-sm transition-all hover:shadow-md">
      <div className="rounded-full bg-primary/10 p-3">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-center text-muted-foreground">{description}</p>
    </div>
  )
}

export default function Home() {
  const account = useCurrentAccount()
  const [userObjects, setUserObjects] = useState<CategorizedObjects | null>(null)
  const router = useRouter()
  const [hasAccount, setHasAccount] = useState(false)
  const [isCheckingAccount, setIsCheckingAccount] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  
  // Reference to the overview section for smooth scrolling
  const overviewRef = useRef<HTMLDivElement>(null)

  // Scroll to overview section
  const scrollToOverview = () => {
    overviewRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 检查用户账户状态
  useEffect(() => {
    async function checkUserProfile() {
      if (!account?.address) return

      setIsCheckingAccount(true)

      try {
        // 实际查询区块链，检查用户是否有 Profile
        const profile = await getProfileByUser(account.address)
        const accountExists = !!profile

        console.log("Profile check:", accountExists ? "Found profile" : "No profile found")
        setHasAccount(accountExists)
      } catch (error) {
        console.error("Error checking profile:", error)
        setHasAccount(false)
      } finally {
        setIsCheckingAccount(false)
      }
    }

    checkUserProfile()
  }, [account?.address, router])

  // 处理"开始使用"按钮点击
  const handleGetStarted = async () => {
    if (!account) {
      // 显示连接钱包弹窗
      setShowConnectDialog(true)
      return
    }

    // 如果正在检查账户状态，显示加载中
    if (isCheckingAccount) {
      return // 可以添加加载指示器
    }

    // 重新检查用户账户状态（以防状态未更新）
    try {
      const profile = await getProfileByUser(account.address)
      const accountExists = !!profile

      if (accountExists) {
        router.push("/explore")
      } else {
        router.push("/create-account")
      }
    } catch (error) {
      console.error("Error in handleGetStarted:", error)
      // 如果查询失败，假设用户没有账户
      router.push("/create-account")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1">
        {/* Hero Section - Enhanced with more spacing and animations */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-48 bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-background overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_650px] items-center">
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Where Projects Dock, <br className="hidden sm:inline" />
                    and Ideas Rock
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                    A secure and unified demo management platform for the Sui developer community.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button onClick={handleGetStarted} size="lg" className="px-8" disabled={isCheckingAccount}>
                    {isCheckingAccount ? "Checking..." : "Get Started"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button onClick={scrollToOverview} variant="outline" size="lg" className="px-8">
                    Learn More
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* 右侧装饰区域 - Enhanced with animations */}
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
                    <div className="flex h-[250px] w-[250px] md:h-[350px] md:w-[350px] items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-70 blur-3xl" />
                  </div>
                  <Ship className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 text-white animate-bounce" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center animate-bounce">
            <MousePointer className="h-6 w-6 text-muted-foreground" />
            <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
          </div>
        </section>

        {/* 连接钱包弹窗 */}
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>请先连接您的钱包以继续使用DemoDock的功能。</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4 gap-4">
              <Wallet className="h-12 w-12 text-primary" />
              <ConnectButton />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Description Section - Enhanced with better spacing and ref for scrolling */}
        <section ref={overviewRef} className="w-full py-20 md:py-28 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto grid max-w-[68rem] gap-10">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-center">Project Overview</h2>
                <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                <p className="max-w-[85%] mx-auto text-zinc-500 dark:text-zinc-400 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed text-center">
                  In the Web3 developer space, many excellent demo projects are scattered across different platforms,
                  making it difficult for creators to manage or showcase their work effectively.
                </p>
              </div>
              <div className="space-y-6 text-zinc-500 dark:text-zinc-400 text-lg max-w-3xl mx-auto">
                <p>
                  DemoDock solves this by providing a secure, decentralized platform to collect, store, and manage demo
                  projects.
                </p>
                <p>
                  It encrypts sensitive information using <strong>Seal</strong>, stores demo files such as videos and
                  presentations on <strong>Walrus</strong>, and gives creators a private, organized space to track their
                  progress. Admins can also view all demos to support the community and encourage collaboration.
                </p>
                <p>
                  DemoDock strengthens the Sui ecosystem by encouraging demo sharing, enabling official review, and
                  improving transparency through on-chain storage and access control.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Video Section - Using the embedded YouTube video from the user's code */}
        <section id="demo" className="w-full py-20 md:py-28 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto flex max-w-[68rem] flex-col items-center justify-center gap-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Demo Video</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
              <p className="max-w-[900px] text-zinc-500 dark:text-zinc-400 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed">
                See DemoDock in action.
              </p>
            </div>
            <div className="mx-auto max-w-5xl rounded-xl border shadow-lg overflow-hidden">
              <div className="aspect-video w-full">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/-pic359ngiY" 
                  title="DemoDock Demo Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
            </div>
            <div className="mx-auto mt-10 flex max-w-[58rem] justify-center">
              <Link
                href="https://github.com/404ll/DemoDock/tree/main"
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
              >
                <Github className="h-6 w-6" />
                <span className="text-lg">View on GitHub</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced with better spacing and hover effects */}
        <section id="features" className="w-full py-20 md:py-28 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed">
                  Built on Walrus distributed storage and Seal encryption for secure, decentralized project sharing
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-8 md:grid-cols-3">
              <FeatureCard
                icon={<Database className="h-12 w-12 text-primary" />}
                title="Decentralized Storage"
                description="Store your demos on Walrus distributed storage for permanent availability"
              />
              <FeatureCard
                icon={<Lock className="h-12 w-12 text-primary" />}
                title="Access Control"
                description="Set permissions and control who can access your project demos"
              />
              <FeatureCard
                icon={<Key className="h-12 w-12 text-primary" />}
                title="On-chain Verification"
                description="All access requests and approvals are recorded on-chain for transparency"
              />
            </div>
          </div>
        </section>

        {/* Core Features Section - Enhanced with better spacing and animations */}
        <section className="w-full py-20 md:py-28 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto flex max-w-[68rem] flex-col items-center justify-center gap-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Core Features</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
              <p className="max-w-[900px] text-zinc-500 dark:text-zinc-400 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed">
                DemoDock provides a comprehensive solution for demo management in the Sui ecosystem.
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center text-center transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="mt-6 text-xl">Encrypted Demo Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Via <strong>Seal</strong>, access controlled by the owner for maximum security.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Database className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="mt-6 text-xl">Decentralized File Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Using <strong>Walrus</strong> for secure and permanent data storage.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Globe className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="mt-6 text-xl">Centralized Demo Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    For users, admins, and the Sui community to browse and engage.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <LineChart className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="mt-6 text-xl">Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Track development status and share demos in one place.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Value Proposition - Enhanced with better spacing and design */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto grid max-w-[68rem] gap-10">
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Value Proposition</h2>
                <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
              <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                <Card className="transition-all hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-1 bg-primary mb-4 rounded-full"></div>
                    <CardTitle className="text-2xl">For Developers & Users</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-lg">
                      A secure space to manage, showcase, and track demos with easy access to all projects.
                    </p>
                  </CardContent>
                </Card>
                <Card className="transition-all hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-1 bg-primary mb-4 rounded-full"></div>
                    <CardTitle className="text-2xl">For the Sui Ecosystem</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-lg">
                      Boosts developer activity, enables centralized review, and promotes a more open and collaborative
                      community.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Technologies Section - Enhanced with better spacing and animations */}
        <section id="tech" className="w-full py-20 md:py-28 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto flex max-w-[68rem] flex-col items-center justify-center gap-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Built With</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
              <p className="max-w-[900px] text-zinc-500 dark:text-zinc-400 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed">
                DemoDock leverages cutting-edge technologies to deliver a secure and efficient platform.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-12 md:grid-cols-4">
              <div className="flex flex-col items-center gap-4 transition-all hover:translate-y-[-5px]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Code className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Sui</h3>
                <p className="text-base text-zinc-500 dark:text-zinc-400 text-center">Core blockchain infrastructure</p>
              </div>
              <div className="flex flex-col items-center gap-4 transition-all hover:translate-y-[-5px]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Seal</h3>
                <p className="text-base text-zinc-500 dark:text-zinc-400 text-center">Encryption layer</p>
              </div>
              <div className="flex flex-col items-center gap-4 transition-all hover:translate-y-[-5px]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <HardDrive className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Walrus</h3>
                <p className="text-base text-zinc-500 dark:text-zinc-400 text-center">Decentralized storage</p>
              </div>
              <div className="flex flex-col items-center gap-4 transition-all hover:translate-y-[-5px]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">React</h3>
                <p className="text-base text-zinc-500 dark:text-zinc-400 text-center">Frontend stack</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section - Enhanced with better spacing and design */}
        <section id="team" className="w-full py-20 md:py-28 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="mx-auto flex max-w-[68rem] flex-col items-center justify-center gap-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Meet the Team</h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
              <p className="max-w-[900px] text-zinc-500 dark:text-zinc-400 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed">
                The talented individuals behind DemoDock.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20">
                      <User className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-3 text-center md:text-left">
                      <h3 className="text-2xl font-bold">Elemen</h3>
                      <p className="text-lg text-zinc-500 dark:text-zinc-400">Project Lead</p>
                      <p className="text-base">
                        Full Stack Developer & Product Manager
                        <br />
                        Blockchain Engineering, Chengdu University of Information Technology
                      </p>
                      <p className="text-base text-zinc-500 dark:text-zinc-400">
                      A passionate student on a mission to become a master developer.
                      Actively learning and building in the blockchain space, with strong interest in the Sui and Move ecosystem.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Enhanced with better spacing */}
      <footer className="w-full border-t py-10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Ship className="h-6 w-6" />
              <p className="text-center text-base leading-loose text-zinc-500 dark:text-zinc-400 md:text-left">
                © 2025 DemoDock. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="mailto:3242388085@qq.com"
                className="text-base text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
              >
                Contact me
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
