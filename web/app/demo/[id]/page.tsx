"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import { ArrowLeft, Download, ExternalLink, Lock, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { getdemoByid } from "@/contracts/query"
import { Demo, Profile, Project } from "@/types"


// Access status type
type AccessStatus = "granted" | "pending" | "denied" | "none"


export default function DemoDetailPage() {
  const params = useParams()
  const demoId = params.id as string
  const account = useCurrentAccount()
  const [demo, setDemo] = useState<Demo | null>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter() // 添加路由器

  // Fetch demo details 更新获取逻辑
  useEffect(() => {
    async function fetchDemoDetails() {
      if (!demoId) return

      try {
        setLoading(true)

        const demoData = await getdemoByid(demoId)
        if (!demoData) {
          console.error("Demo not found")
          setLoading(false)
          return
        }
        setDemo(demoData)
        console.log("Demo data fetched:", demoData) 
        setLoading(false)
       
      } catch (error) {
        console.error("Error fetching demo details:", error)
        setLoading(false)
      }
    }

    fetchDemoDetails()
  }, [demoId, account?.address])


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
                <p>{demo.des}</p>
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
        <div className="text-center py-10">
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
        </div>
      )}
    </div>
  )
}
