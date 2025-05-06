"use client"

import { useState } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { EncryptedUploader } from "@/components/seal/EncryptedUploader"
import { DecryptedViewer } from "@/components/seal/DecryptedViewer"
import { suiClient, networkConfig } from "@/contracts/index"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { InfoCircledIcon, CheckCircledIcon } from "@radix-ui/react-icons"

export default function DemoPage() {
  const account = useCurrentAccount()
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // 获取Package ID
  const packageId = networkConfig.testnet.variables.Package;
  const demoObjectId = "0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526";

  // 这里应该从智能合约中获取policyObject和allowlistId
  const policyObject = demoObjectId
  const allowlistId = demoObjectId
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Seal加密解密演示</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <InfoCircledIcon className="h-4 w-4" />
            <AlertTitle>关于测试</AlertTitle>
            <AlertDescription>
              本页面演示使用Seal库加密文件并上传到Walrus服务。系统会尝试多个Walrus服务以确保上传成功。
            </AlertDescription>
          </Alert>
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">文件加密上传</h2>
            <EncryptedUploader
              policyObject={policyObject}
              packageId={packageId}
              onUploadComplete={(result) => {
                setUploadResult(result)
                setUploadError(null)
                console.log("上传成功:", result)
              }}
              onUploadError={(error) => {
                setUploadError(error)
                setUploadResult(null)
                console.error("上传错误:", error)
              }}
            />
            
            {uploadResult && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircledIcon className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">上传成功</AlertTitle>
                <AlertDescription className="text-green-600">
                  <p>文件名: {uploadResult.fileName}</p>
                  <p>Blob ID: {uploadResult.blobId}</p>
                  {uploadResult.serviceName && (
                    <p>使用服务: {uploadResult.serviceName}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      {uploadResult && account && (
        <Card>
          <CardHeader>
            <CardTitle>解密查看</CardTitle>
          </CardHeader>
          <CardContent>
            <DecryptedViewer
              blobIds={[uploadResult.blobId]}
              allowlistId={allowlistId}
              packageId={packageId}
              userAddress={account.address}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}