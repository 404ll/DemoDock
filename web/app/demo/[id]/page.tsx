"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import { ArrowLeft, Download, ExternalLink, Lock, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { requestDemo } from "@/contracts/query"

const MOCK_DEMOS: Record<string, Demo> = {
  demo1: {
    id: "demo1",
    name: "Web3 Storage Solution",
    description: "A decentralized storage solution built on Sui blockchain with Walrus integration.",
    owner: "0x7c36a610d1cD42F2C9c5D6B962C7d9E1f4fFF2239afa85c9cc78915fef51d4ed",
    accessType: "public",
    url: "https://example.com/demo1",
    category: "Storage",
  },
  demo2: {
    id: "demo2",
    name: "NFT Marketplace",
    description: "An innovative NFT marketplace with support for dynamic NFTs and custom royalty structures.",
    owner: "0x8d45a610d1cD42F2C9c5D6B962C7d9E1f4fFF2239afa85c9cc78915fef51d4ac",
    accessType: "private",
    url: "https://example.com/demo2",
    category: "NFT",
  },
  demo3: {
    id: "demo3",
    name: "DeFi Lending Protocol",
    description: "A lending protocol with algorithmic interest rates and multiple collateral types.",
    owner: "0x9a12a610d1cD42F2C9c5D6B962C7d9E1f4fFF2239afa85c9cc78915fef51d4bd",
    accessType: "restricted",
    url: "https://example.com/demo3",
    category: "DeFi",
  },
}

// Access status type
type AccessStatus = "granted" | "pending" | "denied" | "none"

// 修改 Demo 接口添加类别字段
interface Demo {
  id: string
  name: string
  description: string // 使用正确的属性名
  owner: string
  accessType: "public" | "private" | "restricted"
  url?: string
  category?: string // 添加类别字段
}

export default function DemoDetailPage() {
  const params = useParams()
  const demoId = params.id as string
  const account = useCurrentAccount()
  const [demo, setDemo] = useState<Demo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("none")

  // Fetch demo details
  useEffect(() => {
    async function fetchDemoDetails() {
      if (!demoId) return

      try {
        setLoading(true)

        // 使用测试数据替代 API 调用
        setTimeout(() => {
          // 模拟网络延迟
          const mockDemo = MOCK_DEMOS[demoId]

          if (mockDemo) {
            setDemo(mockDemo)
            // 根据访问类型设置状态
            if (mockDemo.accessType === "public") {
              setAccessStatus("granted")
            }
          }

          setLoading(false)
        }, 800)
      } catch (error) {
        console.error("Error fetching demo details:", error)
        setLoading(false)
      }
    }

    fetchDemoDetails()
  }, [demoId])


  // Handle file download
  const handleDownload = () => {
    //解密逻辑
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p>{demo.description}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Demo Files
            </Button>
          </CardFooter>
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
 
    </div>
  )
}
