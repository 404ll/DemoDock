"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import { ArrowLeft, Download, ExternalLink, Lock, Shield, FileType, Github, Tag, Info, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getdemoByid, getCapByDemoId, getFeedDataByDemoId } from "@/contracts/query"
import type { Demo } from "@/types"
import { SealClient, SessionKey } from "@mysten/seal"
import { getAllowlistedKeyServers } from "@mysten/seal"
import type { Transaction } from "@mysten/sui/transactions"
import { networkConfig } from "@/contracts/index"
import { fromHex } from "@mysten/sui/utils"
import { downloadAndDecrypt } from "@/components/seal/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DemoDetailPage() {
  const params = useParams()
  const demoId = params.id as string
  const account = useCurrentAccount()
  const [demo, setDemo] = useState<Demo | null>(null)
  const [loading, setLoading] = useState(true)
  const suiClient = useSuiClient()
  const router = useRouter()

  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptProgress, setDecryptProgress] = useState(0)
  const [blobIds, setBlobIds] = useState<string[]>([])
  const [capId, setCapId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<{ url: string; type: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const packageId = networkConfig.testnet.variables.Package

  // Simulate decryption progress
  useEffect(() => {
    if (isDecrypting) {
      const interval = setInterval(() => {
        setDecryptProgress((prev) => {
          const next = prev + Math.random() * 15
          return next > 95 ? 95 : next
        })
      }, 500)
      return () => clearInterval(interval)
    } else {
      setDecryptProgress(0)
    }
  }, [isDecrypting])

  // Fetch demo details
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

        if (account?.address) {
          try {
            const capResult = await getCapByDemoId(account.address, demoId)
            setCapId(capResult)

            const feedData = await getFeedDataByDemoId(demoId)
            setBlobIds(feedData.blobIds)
            console.log("获取到的BlobIDs:", feedData.blobIds)
          } catch (error) {
            console.error("获取解密信息失败:", error)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching demo details:", error)
        setLoading(false)
      }
    }

    fetchDemoDetails()
  }, [demoId, account?.address])

  const constructMoveCall = (demoId: string) => {
    return (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${packageId}::demo::seal_approve`,
        arguments: [
          tx.pure.vector("u8", fromHex(id)),
          tx.object(demoId),
          tx.object(networkConfig.testnet.variables.AdminList),
        ],
      })
    }
  }

  const handleDownload = async () => {
    if (!demoId || !account?.address) {
      setError("Please connect your wallet first")
      return
    }

    if (blobIds.length === 0) {
      setError("This demo has no downloadable files")
      return
    }

    setIsDecrypting(true)
    setError(null)

    const sealClient = new SealClient({
      suiClient,
      serverObjectIds: getAllowlistedKeyServers("testnet"),
      verifyKeyServers: false,
    })

    if (currentSessionKey && !currentSessionKey.isExpired() && currentSessionKey.getAddress() === account?.address) {
      const moveCallConstructor = constructMoveCall(demoId)
      downloadAndDecrypt(
        blobIds,
        currentSessionKey,
        suiClient,
        sealClient,
        moveCallConstructor,
        setError,
        setDecryptedFileUrls,
        setIsDialogOpen,
        setReloadKey,
      )
      setIsDecrypting(false)
      setDecryptProgress(100)
      return
    }

    setCurrentSessionKey(null)
    const sessionKey = new SessionKey({
      address: account?.address ?? "0x0",
      packageId,
      ttlMin: 10,
    })

    try {
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature)
            const moveCallConstructor = constructMoveCall(demoId)
            await downloadAndDecrypt(
              blobIds,
              sessionKey,
              suiClient,
              sealClient,
              moveCallConstructor,
              setError,
              setDecryptedFileUrls,
              setIsDialogOpen,
              setReloadKey,
            )
            setCurrentSessionKey(sessionKey)
            setIsDecrypting(false)
            setDecryptProgress(100)
          },
          onError: (error) => {
            console.error("Signature failed:", error)
            setError(`Signature failed: ${error.message}`)
            setIsDecrypting(false)
          },
        },
      )
    } catch (error: any) {
      console.error("Error:", error)
      setIsDecrypting(false)
      setError(`Processing error: ${error.message}`)
    }
  }

  const MediaItem = ({ fileUrl, mimeType, index }: { fileUrl: string; mimeType: string; index: number }) => {
    const isVideo = mimeType.startsWith("video/")
    const isPPT = mimeType.includes("powerpoint") || mimeType.includes("presentation")
    const [loadError, setLoadError] = useState(false)

    return (
      <div className="media-item my-4 border rounded-lg overflow-hidden bg-card">
        <div className="flex items-center justify-between p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            {isVideo ? (
              <FileType className="h-5 w-5 text-blue-500" />
            ) : isPPT ? (
              <FileText className="h-5 w-5 text-orange-500" />
            ) : (
              <FileText className="h-5 w-5 text-green-500" />
            )}
            <h3 className="text-sm font-medium">
              File {index + 1} <span className="text-muted-foreground">({mimeType})</span>
            </h3>
          </div>
          <Button size="sm" variant="outline" asChild className="gap-1">
            <a href={fileUrl} download={`demo-file-${index}.${isVideo ? "mp4" : isPPT ? "pptx" : "bin"}`}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </Button>
        </div>

        <div className="p-4">
          {isVideo ? (
            !loadError ? (
              <video
                controls
                width="100%"
                src={fileUrl}
                className="max-h-[300px] rounded bg-muted/20"
                onError={() => setLoadError(true)}
              >
                Your browser doesn't support video playback.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] bg-muted/20 rounded">
                <p className="text-muted-foreground">Video loading failed, please use the download button to view</p>
              </div>
            )
          ) : isPPT ? (
            <div className="flex flex-col items-center justify-center h-[200px] bg-muted/20 rounded p-6">
              <FileText className="h-16 w-16 text-orange-500 mb-4 opacity-70" />
              <p className="text-muted-foreground">PowerPoint file preview not available</p>
              <p className="text-sm text-muted-foreground">Please download to view</p>
            </div>
          ) : (
            <div>
              {!loadError ? (
                <img
                  src={fileUrl || "/placeholder.svg"}
                  alt={`解密文件 ${index + 1}`}
                  className="max-w-full max-h-[300px] mx-auto rounded"
                  onError={() => setLoadError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] bg-muted/20 rounded">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-70" />
                  <p className="text-muted-foreground">File preview failed</p>
                  <p className="text-sm text-muted-foreground">Please download to view</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Generate a random avatar fallback from demo name
  const getAvatarFallback = (name: string) => {
    if (!name) return "DM"
    return name.substring(0, 2).toUpperCase()
  }

  // Get demo type badge color
  const getTypeColor = (type: string) => {
    const types: Record<string, string> = {
      game: "bg-green-100 text-green-800 border-green-200",
      defi: "bg-blue-100 text-blue-800 border-blue-200",
      nft: "bg-purple-100 text-purple-800 border-purple-200",
      social: "bg-yellow-100 text-yellow-800 border-yellow-200",
      tool: "bg-gray-100 text-gray-800 border-gray-200",
    }

    return types[type?.toLowerCase()] || "bg-primary/10 text-primary border-primary/20"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-16">
      <div className="container max-w-5xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild className="group">
            <Link href="/explore" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Explore
            </Link>
          </Button>

        </div>

        {loading ? (
          <Card className="overflow-hidden border shadow-md">
            <CardHeader className="pb-4">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-8 w-3/4" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ) : demo ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Sidebar */}
            <div className="md:col-span-1 space-y-6">
              <Card className="overflow-hidden border shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={`https://avatar.vercel.sh/${demo.name}.png`} alt={demo.name} />
                      <AvatarFallback>{getAvatarFallback(demo.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{demo.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className={`mt-1 ${getTypeColor(demo.demo_type as string)}`}>
                          {demo.demo_type}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
                        <Info className="h-4 w-4" />
                        Status
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                        <span className="text-sm">Available</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
                        <Github className="h-4 w-4" />
                        Repository
                      </div>
                      {demo.repo ? (
                        <a
                          href={String(demo.repo).startsWith("http") ? String(demo.repo) : `https://${String(demo.repo)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center gap-1.5 text-primary"
                        >
                          {demo.repo}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not available</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
                        <Tag className="h-4 w-4" />
                      <span className="text-sm">{demo.demo_type || "Not specified"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1.5">
                        <Shield className="h-4 w-4" />
                        Access
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Lock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Restricted access</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col pt-2 pb-6 px-6">
                  <Button className="w-full" onClick={handleDownload} disabled={isDecrypting || blobIds.length === 0}>
                    {isDecrypting ? (
                      <>
                        <span className="mr-2">Decrypting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Files
                      </>
                    )}
                  </Button>

                  {isDecrypting && (
                    <div className="w-full flex mt-3">
                      <Progress value={decryptProgress} className="h-1.5" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">
                        {Math.round(decryptProgress)}% complete
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="w-full mt-3 px-3 py-2 text-sm bg-destructive/10 text-destructive rounded-md">
                      {error}
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Main content */}
            <div className="md:col-span-2">
              <Card className="overflow-hidden border shadow-md">
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <CardHeader className="pb-2 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="files" disabled={decryptedFileUrls.length === 0}>
                        Files {decryptedFileUrls.length > 0 && `(${decryptedFileUrls.length})`}
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent className="p-6">
                    <TabsContent value="overview" className="mt-0 space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">About this demo</h3>
                        <p className="text-muted-foreground">{demo.des || "No description provided."}</p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-3">How to use</h3>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                              <span className="text-sm font-medium">1</span>
                            </div>
                            <div className="space-y-1.5">
                              <p className="font-medium">Download the demo files</p>
                              <p className="text-sm text-muted-foreground">
                                Click the "Download Files" button to decrypt and download the demo files.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                              <span className="text-sm font-medium">2</span>
                            </div>
                            <div className="space-y-1.5">
                              <p className="font-medium">Preview the files</p>
                              <p className="text-sm text-muted-foreground">
                                After decryption, you can preview the files directly in your browser.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                              <span className="text-sm font-medium">3</span>
                            </div>
                            <div className="space-y-1.5">
                              <p className="font-medium">Explore the repository</p>
                              <p className="text-sm text-muted-foreground">
                                Check out the repository for more details and source code.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="files" className="mt-0">
                      {decryptedFileUrls.length > 0 ? (
                        <div className="space-y-4">
                          {decryptedFileUrls.map((file, index) => (
                            <MediaItem
                              key={`${index}-${reloadKey}`}
                              fileUrl={file.url}
                              mimeType={file.type}
                              index={index}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-4" />
                          <h3 className="text-lg font-medium mb-1">No files available</h3>
                          <p className="text-sm text-muted-foreground">Download the demo files to view them here.</p>
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <Card className="max-w-md mx-auto border shadow-md">
              <CardHeader>
                <CardTitle>Demo Not Found</CardTitle>
                <CardDescription>The requested demo could not be found.</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link href="/explore">Back to Explore</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Decrypted Files</DialogTitle>
            <DialogDescription>Decryption successful! You can now preview or download these files.</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh]">
            {decryptedFileUrls.length > 0 ? (
              <div className="space-y-4">
                {decryptedFileUrls.map((file, index) => (
                  <MediaItem key={`${index}-${reloadKey}`} fileUrl={file.url} mimeType={file.type} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-4" />
                <p className="text-muted-foreground">No preview files found</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {decryptedFileUrls.length > 0 && (
              <Button
                onClick={() => {
                  setActiveTab("files")
                  setIsDialogOpen(false)
                }}
              >
                View in Files Tab
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
