"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import { ArrowLeft, Download, ExternalLink, Lock, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { getdemoByid, getCapByDemoId, getFeedDataByDemoId } from "@/contracts/query"
import { Demo, Profile, Project } from "@/types"
import { SealClient, SessionKey } from '@mysten/seal'
import { getAllowlistedKeyServers } from '@mysten/seal'
import { Transaction } from '@mysten/sui/transactions'
import { networkConfig } from '@/contracts/index'
import { fromHex } from '@mysten/sui/utils'
import { downloadAndDecrypt } from '@/components/seal/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Access status type
type AccessStatus = "granted" | "pending" | "denied" | "none"

export default function DemoDetailPage() {
  const params = useParams()
  const demoId = params.id as string
  const account = useCurrentAccount()
  const [demo, setDemo] = useState<Demo | null>(null)
  const [loading, setLoading] = useState(true)
  const suiClient = useSuiClient()
  const router = useRouter()

  const [isDecrypting, setIsDecrypting] = useState(false)
  const [blobIds, setBlobIds] = useState<string[]>([])
  const [capId, setCapId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<{ url: string; type: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null)

  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const packageId = networkConfig.testnet.variables.Package

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
        arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(demoId), tx.object(networkConfig.testnet.variables.AdminList)],
      });
    };
  };

  const handleDownload = async () => {
    if (!demoId || !account?.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (blobIds.length === 0) {
      setError("This demo has no downloadable files");
      return;
    }

    setIsDecrypting(true);
    setError(null);

    const sealClient = new SealClient({
      suiClient,
      serverObjectIds: getAllowlistedKeyServers('testnet'),
      verifyKeyServers: false,
    });

    if (
      currentSessionKey &&
      !currentSessionKey.isExpired() &&
      currentSessionKey.getAddress() === account?.address
    ) {
      const moveCallConstructor = constructMoveCall(demoId);
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
      );
      setIsDecrypting(false);
      return;
    }

    setCurrentSessionKey(null);
    const sessionKey = new SessionKey({
      address: account?.address ?? '0x0',
      packageId,
      ttlMin: 10,
    });

    try {
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            const moveCallConstructor = constructMoveCall(demoId);
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
            );
            setCurrentSessionKey(sessionKey);
            setIsDecrypting(false);
          },
          onError: (error) => {
            console.error('Signature failed:', error);
            setError(`Signature failed: ${error.message}`);
            setIsDecrypting(false);
          }
        }
      );
    } catch (error: any) {
      console.error('Error:', error);
      setIsDecrypting(false);
      setError(`Processing error: ${error.message}`);
    }
  }

  const MediaItem = ({ fileUrl, mimeType, index }: { fileUrl: string, mimeType: string, index: number }) => {
    const isVideo = mimeType.startsWith('video/');
    const isPPT = mimeType.includes('powerpoint') || mimeType.includes('presentation');
    const [loadError, setLoadError] = useState(false);

    return (
      <div className="media-item my-4 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">File {index + 1} ({mimeType})</h3>
          <Button size="sm" variant="outline" asChild>
            <a 
              href={fileUrl} 
              download={`demo-file-${index}.${isVideo ? 'mp4' : isPPT ? 'pptx' : 'bin'}`}
            >
              Download file
            </a>
          </Button>
        </div>
        
        {isVideo ? (
          !loadError ? (
            <video 
              controls 
              width="100%" 
              src={fileUrl}
              className="max-h-[300px] rounded bg-gray-100"
              onError={() => setLoadError(true)}
            >
              Your browser doesn't support video playback.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] bg-gray-100 rounded">
              <p className="text-gray-500">Video loading failed, please use the download button to view</p>
            </div>
          )
        ) : isPPT ? (
          <div className="text-center p-6 border rounded">
            <p>PowerPoint file</p>
          </div>
        ) : (
          <div>
            {!loadError ? (
              <img 
                src={fileUrl} 
                alt={`解密文件 ${index + 1}`} 
                className="max-w-full max-h-[300px]"
                onError={() => setLoadError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] bg-gray-100 rounded">
                <p className="text-gray-500">File preview failed, please use the download button to view</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleDownload}
              disabled={isDecrypting || blobIds.length === 0}
            >
              {isDecrypting ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Decrypting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Decrypt and download demo files
                </>
              )}
            </Button>
            
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Decrypted File Preview</DialogTitle>
            <DialogDescription>
              Decryption successful! You can now preview or download these files.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh]">
            {decryptedFileUrls.length > 0 ? (
              <div className="flex flex-col gap-4">
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
              <p className="text-center py-8 text-gray-500">No preview files found</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            {decryptedFileUrls.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = decryptedFileUrls[0].url;
                  link.download = `demo-file.${decryptedFileUrls[0].type.includes('video') ? 'mp4' : 'bin'}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download file
              </Button>
            )}
            <Button onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
