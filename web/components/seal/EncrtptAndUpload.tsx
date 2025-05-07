"use client"

import type React from "react"
import { useState } from "react"
import { Transaction } from "@mysten/sui/transactions"
import { networkConfig } from "@/contracts/index"
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { AlertCircle, FileUp, Upload, Check, Link, ExternalLink, Shield, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal"
import { fromHex, toHex } from "@mysten/sui/utils"
import { useRouter } from "next/navigation"

export type Data = {
  status: string
  blobId: string
  endEpoch: string
  suiRefType: string
  suiRef: string
  suiBaseUrl: string
  blobUrl: string
  suiUrl: string
  isImage: string
  isVideo: string
  isPPT?: boolean
}

interface WalrusUploadProps {
  policyObject: string
  cap_id: string
  moduleName: string
}

type WalrusService = {
  id: string
  name: string
  publisherUrl: string
  aggregatorUrl: string
}

export function WalrusUpload({ policyObject, cap_id, moduleName }: WalrusUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<Data | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [selectedService, setSelectedService] = useState<string>("service1")
  const [uploadStep, setUploadStep] = useState<"idle" | "encrypting" | "uploading" | "binding" | "complete">("idle")
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`
  const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`

  const NUM_EPOCH = 1
  const packageId = networkConfig.testnet.variables.Package
  const suiClient = useSuiClient()
  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  })

  const services: WalrusService[] = [
    {
      id: "service1",
      name: "walrus.space",
      publisherUrl: "/publisher1",
      aggregatorUrl: "/aggregator1",
    },
    {
      id: "service2",
      name: "staketab.org",
      publisherUrl: "/publisher2",
      aggregatorUrl: "/aggregator2",
    },
    {
      id: "service3",
      name: "redundex.com",
      publisherUrl: "/publisher3",
      aggregatorUrl: "/aggregator3",
    },
    {
      id: "service4",
      name: "nodes.guru",
      publisherUrl: "/publisher4",
      aggregatorUrl: "/aggregator4",
    },
    {
      id: "service5",
      name: "banansen.dev",
      publisherUrl: "/publisher5",
      aggregatorUrl: "/aggregator5",
    },
    {
      id: "service6",
      name: "everstake.one",
      publisherUrl: "/publisher6",
      aggregatorUrl: "/aggregator6",
    },
  ]

  function getAggregatorUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService)
    const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "")
    return `/api${service?.aggregatorUrl}/v1/${cleanPath}`
  }

  function getPublisherUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService)
    const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "")
    return `/api${service?.publisherUrl}/v1/${cleanPath}`
  }

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 100 * 1024 * 1024) {
      alert("File size must be less than 100MB")
      return
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
      "application/vnd.openxmlformats-officedocument.presentationml.template",
    ]

    if (!validTypes.some((type) => selectedFile.type === type)) {
      alert("Only images, videos, and PowerPoint files are supported")
      return
    }

    setFile(selectedFile)
    setInfo(null)
  }

  const handleUploadAndBind = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    if (!policyObject || !cap_id) {
      setError("Missing required project configuration")
      return
    }

    setIsUploading(true)
    setUploadStep("encrypting")
    setUploadProgress(10)
    setError(null)

    try {
      const reader = new FileReader()

      reader.onload = async (event) => {
        if (event.target && event.target.result) {
          const result = event.target.result
          if (result instanceof ArrayBuffer) {
            try {
              setUploadProgress(30)
              const nonce = crypto.getRandomValues(new Uint8Array(5))
              const policyObjectBytes = fromHex(policyObject)
              const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]))

              const { encryptedObject: encryptedBytes } = await client.encrypt({
                threshold: 2,
                packageId,
                id,
                data: new Uint8Array(result),
              })

              setUploadStep("uploading")
              setUploadProgress(60)

              const storageInfo = await storeBlob(encryptedBytes)
              const uploadInfo = displayUpload(storageInfo.info, file.type)

              setUploadStep("binding")
              setUploadProgress(80)

              await publishToContract(policyObject, cap_id, moduleName, uploadInfo.blobId)

              setUploadStep("complete")
              setUploadProgress(100)

              setTimeout(() => {
                router.push("/explore")
              }, 2000)
            } catch (error: any) {
              console.error("Error during processing:", error)
              setError(`Upload failed: ${error.message}`)
              setUploadStep("idle")
              setIsUploading(false)
            }
          } else {
            setError("File format not supported")
            setUploadStep("idle")
            setIsUploading(false)
          }
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (error: any) {
      setError(`Error during upload: ${error.message}`)
      setUploadStep("idle")
      setIsUploading(false)
    }
  }

  const publishToContract = (wl_id: string, cap_id: string, moduleName: string, blobId: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = new Transaction()
        tx.moveCall({
          target: `${packageId}::${moduleName}::publish`,
          arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.string(blobId)],
        })

        tx.setGasBudget(10000000)

        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              console.log("Contract binding successful:", result)
              resolve()
            },
            onError: (error) => {
              console.error("Contract binding failed:", error)
              setError(`Binding failed: ${error.message}`)
              reject(error)
            },
          },
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  const displayUpload = (storage_info: any, media_type: any): Data => {
    let info
    const isPPT =
      media_type.includes("powerpoint") ||
      media_type.includes("presentation") ||
      media_type.endsWith(".ppt") ||
      media_type.endsWith(".pptx")

    if ("alreadyCertified" in storage_info) {
      info = {
        status: "Already certified",
        blobId: storage_info.alreadyCertified.blobId,
        endEpoch: storage_info.alreadyCertified.endEpoch,
        suiRefType: "Previous Sui Certified Event",
        suiRef: storage_info.alreadyCertified.event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
        blobUrl: getAggregatorUrl(`/v1/blobs/${storage_info.alreadyCertified.blobId}`),
        suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.alreadyCertified.event.txDigest}`,
        isImage: media_type.startsWith("image"),
        isVideo: media_type.startsWith("video"),
        isPPT: isPPT,
      }
    } else if ("newlyCreated" in storage_info) {
      info = {
        status: "Newly created",
        blobId: storage_info.newlyCreated.blobObject.blobId,
        endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: "Associated Sui Object",
        suiRef: storage_info.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
        blobUrl: getAggregatorUrl(`/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`),
        suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.newlyCreated.blobObject.id}`,
        isImage: media_type.startsWith("image"),
        isVideo: media_type.startsWith("video"),
        isPPT: isPPT,
      }
    } else {
      throw Error("Unhandled successful response!")
    }
    setInfo(info)
    return info
  }

  const storeBlob = (encryptedData: Uint8Array) => {
    const url = getPublisherUrl(`/v1/blobs?epochs=${NUM_EPOCH}`)
    console.log("===DEBUG=== Upload URL:", url)
    console.log("===DEBUG=== Selected service:", selectedService)
    console.log("===DEBUG=== Encrypted data size:", encryptedData.byteLength)
    console.log(
      "===DEBUG=== Service object:",
      services.find((s) => s.id === selectedService),
    )

    return fetch(url, {
      method: "PUT",
      body: encryptedData,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    })
      .then((response) => {
        console.log("===DEBUG=== Response status:", response.status, response.statusText)

        if (response.status === 200) {
          return response.json().then((info) => {
            console.log("===DEBUG=== Success response:", info)
            return { info }
          })
        } else {
          console.error("===DEBUG=== Error response:", response.status)
          response.text().then((text) => console.error("===DEBUG=== Error details:", text))
          alert("Error publishing the blob on Walrus, please select a different Walrus service.")
          setIsUploading(false)
          throw new Error("Something went wrong when storing the blob!")
        }
      })
      .catch((error) => {
        console.error("===DEBUG=== Caught error:", error)
        throw error
      })
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-2xl font-bold">Encrypted File Upload</CardTitle>
        <CardDescription>
          Files will be encrypted and stored on Walrus services, automatically binding to your project
        </CardDescription>
      </CardHeader>

      <Separator className="mb-4" />

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Walrus Service Provider:</span>
          </div>

          <Select value={selectedService} onValueChange={setSelectedService} disabled={isUploading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading ? "border-slate-200 bg-slate-50" : "border-blue-200 hover:bg-blue-50 cursor-pointer"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full ${isUploading ? "bg-slate-100" : "bg-blue-50"}`}>
              <FileUp size={28} className={isUploading ? "text-slate-400" : "text-blue-500"} />
            </div>

            {!isUploading ? (
              <>
                <div className="space-y-1">
                  <label htmlFor="file-upload" className="text-sm font-medium cursor-pointer">
                    <span className="text-blue-600">Click to select a file</span>
                    <span className="text-slate-600"> or drag and drop</span>
                  </label>

                  <p className="text-xs text-slate-500">100MB max. Supports images, videos, and PowerPoint files.</p>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.ppt,.pptx,.ppsx,.potx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="hidden"
                  aria-label="Select file to upload"
                  disabled={isUploading}
                />
              </>
            ) : (
              <p className="text-sm text-slate-500">Processing file, please wait...</p>
            )}

            {file && (
              <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs">
                <FileCode size={14} />
                <span className="font-medium">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isUploading && (
          <div className="p-4 border border-blue-100 rounded-md bg-blue-50">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {uploadStep === "encrypting" && "Encrypting file..."}
                  {uploadStep === "uploading" && "Uploading to Walrus..."}
                  {uploadStep === "binding" && "Binding to project..."}
                  {uploadStep === "complete" && "Processing complete!"}
                </span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>

              <Progress value={uploadProgress} className={uploadStep === "complete" ? "bg-green-100" : "bg-blue-100"} />

              <p className="text-xs text-slate-500">
                {uploadStep === "encrypting" && "Encryption ensures your file is secure..."}
                {uploadStep === "uploading" && "Uploading to distributed storage..."}
                {uploadStep === "binding" && "Binding file to your project..."}
                {uploadStep === "complete" && "All steps completed, redirecting soon..."}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button
          onClick={handleUploadAndBind}
          disabled={!file || isUploading || !policyObject || !cap_id}
          className="w-full"
          size="lg"
        >
          <Upload className="mr-2 h-4 w-4" />
          Encrypt, Upload & Bind to Project
        </Button>

        {uploadStep === "complete" && info && (
          <div className="w-full p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1 rounded-full">
                  <Check size={16} className="text-green-600" />
                </div>
                <span className="font-medium text-green-700">Processing Complete!</span>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">File ID:</span>
                <Badge variant="outline" className="font-mono">
                  {info.blobId.substring(0, 16)}...
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={info.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    <Link size={14} />
                    View Encrypted File
                  </a>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <a
                    href={info.suiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    <ExternalLink size={14} />
                    View Blockchain Record
                  </a>
                </Button>
              </div>

              <p className="text-sm text-green-600">Upload and binding successful, redirecting to explore page...</p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export default WalrusUpload
