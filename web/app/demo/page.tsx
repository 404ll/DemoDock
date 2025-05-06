"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import { ArrowLeft, ExternalLink, Lock, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { getdemoByid, requestDemo,  } from "@/contracts/query"

const MOCK_DEMOS: Record<string, Demo> = {
  "demo1": {
    id: "demo1",
    name: "Web3 Storage Solution",
    description: "A decentralized storage solution built on Sui blockchain with Walrus integration.",
    owner: "0x7c36a610d1cD42F2C9c5D6B962C7d9E1f4fFF2239afa85c9cc78915fef51d4ed",
    accessType: "public",
    url: "https://example.com/demo1",
    category: "Storage"
  },
  "demo2": {
    id: "demo2",
    name: "NFT Marketplace",
    description: "An innovative NFT marketplace with support for dynamic NFTs and custom royalty structures.",
    owner: "0x8d45a610d1cD42F2C9c5D6B962C7d9E1f4fFF2239afa85c9cc78915fef51d4ac",
    accessType: "private",
    url: "https://example.com/demo2",
    category: "NFT"
  },
  "demo3": {
    id: "demo3",
    name: "DeFi Lending Protocol",
    description: "A lending protocol with algorithmic interest rates and multiple collateral types.",
    owner: "0x9a12a610d1cD42F2C9c5D6B962C7d9E1f4fFF2239afa85c9cc78915fef51d4bd",
    accessType: "restricted",
    url: "https://example.com/demo3",
    category: "DeFi"
  }
};

// Access status type
type AccessStatus = "granted" | "pending" | "denied" | "none"

// 修改 Demo 接口添加类别字段
interface Demo {
  id: string;
  name: string;
  description: string; // 使用正确的属性名
  owner: string;
  accessType: "public" | "private" | "restricted"; 
  url?: string;
  category?: string; // 添加类别字段
}

export default function DemoDetailPage() {
  const params = useParams()
  const demoId = params.id as string
  const account = useCurrentAccount()
  const testdemo = "public"
  const [demo, setDemo] = useState<Demo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("none")
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const { handleSignAndExecuteTransaction: requestDemoAccess } = useBetterSignAndExecuteTransaction({
    tx: requestDemo,
  })
  
  // Fetch demo details
  useEffect(() => {
    async function fetchDemoDetails() {
      if (!demoId) return;

      try {
        setLoading(true);
        
        // 使用测试数据替代 API 调用
        setTimeout(() => {
          // 模拟网络延迟
          const mockDemo = MOCK_DEMOS[demoId];
          
          if (mockDemo) {
            setDemo(mockDemo);
            // 根据访问类型设置状态
            if (mockDemo.accessType === "public") {
              setAccessStatus("granted");
            }
          }
          
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error("Error fetching demo details:", error);
        setLoading(false);
      }
    }

    fetchDemoDetails();
  }, [demoId])

  // // 检查是否有权限查看演示
  // useEffect(() => {
  //   async function checkAccess() {
  //     if (!account?.address || !demoId) return

  //     try {
  //       const status = await checkAccessStatus(demoId, account.address)
  //       setAccessStatus(status)
  //     } catch (error) {
  //       console.error("Error checking access status:", error)
  //       setAccessStatus("none")
  //     }
  //   }

  //   checkAccess()
  // }, [account?.address, demoId])

  // 发送访问请求
  const handleRequestAccess = async () => {
    if (!account) {
      setShowConnectDialog(true)
      return
    }

    if (!demo) return

    try {
      setIsRequesting(true)
      // requestDemoAccess(demoId, des)
      setAccessStatus("pending")
      setRequestSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setRequestSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error requesting access:", error)
    } finally {
      setIsRequesting(false)
    }
  }

  // Render access status badge
  const renderAccessBadge = () => {
    switch (accessStatus) {
      case "granted":
        return <Badge className="bg-green-500">Access Granted</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Request Pending
          </Badge>
        )
      case "denied":
        return <Badge variant="destructive">Access Denied</Badge>
      default:
        return null
    }
  }

  // Render access button based on status
  const renderAccessButton = () => {
    if (!demo) return null

    if (testdemo === "public") {
      return (
        <Button className="w-full">
          View Demo <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      )
    }

    switch (accessStatus) {
      case "granted":
        return (
          <Button className="w-full">
            View Demo <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )
      case "pending":
        return (
          <Button disabled className="w-full">
            Request Pending <Lock className="ml-2 h-4 w-4" />
          </Button>
        )
      case "denied":
        return (
          <Button variant="outline" className="w-full" disabled>
            Access Denied <Shield className="ml-2 h-4 w-4" />
          </Button>
        )
      default:
        return (
          <Button className="w-full" disabled={isRequesting}>
            {isRequesting ? "Requesting..." : "Request Access"} <Lock className="ml-2 h-4 w-4" />
          </Button>
        )
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Explore
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ) : demo ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{demo.name}</CardTitle>
              {renderAccessBadge()}
            </div>
            <CardDescription>
              {testdemo === "public" ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  {testdemo === "private" ? "Private" : "Restricted"}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p>{demo.description}</p>
              </div>

              {/* <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Owner</h3>
                <p className="text-sm font-mono">{demo.owner}</p>
              </div> */}

              {requestSuccess && (
                <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm">
                  Access request submitted successfully! The owner will review your request.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>{renderAccessButton()}</CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Demo Not Found</CardTitle>
            <CardDescription>The requested demo could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/explore">Back to Explore</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Connect wallet dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>Please connect your wallet to request access to this demo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <ConnectButton />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
