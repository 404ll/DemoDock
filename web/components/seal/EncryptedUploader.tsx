"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, File, Upload, X } from "lucide-react"
import { useSuiClient } from "@mysten/dapp-kit"
import { encryptAndUpload } from "@/utils/sealutils"

interface EncryptedUploaderProps {
  policyObject: string
  packageId: string
  onUploadComplete?: (result: any) => void
  onUploadError?: (error: string) => void
}

export function EncryptedUploader({
  policyObject,
  packageId,
  onUploadComplete,
  onUploadError
}: EncryptedUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suiClient = useSuiClient()
  
  // 文件大小限制 (100MB)
  const MAX_FILE_SIZE = 100 * 1024 * 1024
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("文件大小不能超过100MB")
        return
      }
      
      const validTypes = [
        // 图片类型
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
        // 视频类型
        'video/mp4', 'video/webm', 'video/ogg',
        // PPT类型
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        'application/vnd.openxmlformats-officedocument.presentationml.template'
      ]
      
      if (!validTypes.some(type => selectedFile.type === type)) {
        setError("仅支持图片、视频和PowerPoint文件")
        return
      }
      
      setFile(selectedFile)
      setError(null)
    }
  }
  
  const handleUpload = async () => {
    if (!file) {
      setError("请先选择文件")
      return
    }
    
    setIsUploading(true)
    setProgress(10)
    setError(null)
    
    try {
      setProgress(30)
      
      // 使用更新后的encryptAndUpload函数
      const result = await encryptAndUpload(
        file,
        policyObject,
        suiClient,
        packageId
      )
      
      setProgress(100)
      
      if (onUploadComplete) {
        onUploadComplete(result)
      }
    } catch (error) {
      console.error("上传失败:", error)
      
      // 提供更友好的错误提示
      let errorMessage = error instanceof Error ? error.message : "上传失败";
      if (errorMessage.includes("所有Walrus服务上传失败")) {
        errorMessage = "无法连接到Walrus服务，请检查网络连接或稍后再试";
      }
      
      setError(errorMessage)
      if (onUploadError) {
        onUploadError(errorMessage)
      }
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <Card>
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*,.ppt,.pptx,.ppsx,.potx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        />
        {file && (
          <div>
            <p>已选择: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
          </div>
        )}
        {error && (
          <div>
            <AlertCircle className="text-red-500" />
            <p>{error}</p>
          </div>
        )}
        <Button 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? `上传中 (${progress}%)` : "加密并上传"}
        </Button>
        {isUploading && <Progress value={progress} />}
      </CardContent>
    </Card>
  )
}