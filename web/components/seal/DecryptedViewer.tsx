"use client"

import { useState } from "react"
import { useSuiClient, useSignPersonalMessage } from "@mysten/dapp-kit"
import { SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal"
import { Transaction } from "@mysten/sui/transactions"
import { fromHex } from "@mysten/sui/utils"
import { downloadAndDecrypt } from "@/utils/sealutils"

interface DecryptedViewerProps {
  blobIds: string[]
  allowlistId: string
  packageId: string
  userAddress: string
}

export function DecryptedViewer({
  blobIds,
  allowlistId,
  packageId,
  userAddress
}: DecryptedViewerProps) {
  const suiClient = useSuiClient()
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const [decryptedFiles, setDecryptedFiles] = useState<{url: string, type: string}[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 创建moveCallConstructor函数
  const constructMoveCall = (packageId: string, allowlistId: string) => {
    return (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${packageId}::demo::seal_approve`,
        arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(allowlistId)],
      });
    };
  };
  
  const handleDecrypt = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 创建SealClient
      const sealClient = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers('testnet'),
        verifyKeyServers: false,
      })
      
      // 创建SessionKey
      const sessionKey = new SessionKey({
        address: userAddress,
        packageId,
        ttlMin: 10, // 10分钟有效
      })
      
      // 获取签名
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            // 设置签名
            await sessionKey.setPersonalMessageSignature(result.signature)
            
            // 构建moveCall
            const moveCallConstructor = constructMoveCall(packageId, allowlistId)
            
            // 下载并解密
            await downloadAndDecrypt(
              blobIds,
              sessionKey,
              suiClient,
              sealClient,
              moveCallConstructor,
              (error) => setError(error),
              (files) => {
                setDecryptedFiles(files)
                setIsLoading(false)
              }
            )
          },
          onError: (error) => {
            setError(`签名失败: ${error.message}`)
            setIsLoading(false)
          }
        }
      )
    } catch (error) {
      setError(`解密失败: ${error instanceof Error ? error.message : String(error)}`)
      setIsLoading(false)
    }
  }
  
  // 渲染媒体文件
  const renderMedia = (url: string, type: string, index: number) => {
    const isPPT = type.includes('powerpoint') || type.includes('presentation')
    const isVideo = type.startsWith('video/')
    
    if (isPPT) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>PowerPoint演示文稿</div>
          <a href={url} download={`presentation-${index}.pptx`}>
            下载演示文稿
          </a>
        </div>
      )
    } else if (isVideo) {
      return (
        <video controls src={url} style={{ maxWidth: '100%' }}>
          您的浏览器不支持视频播放
        </video>
      )
    } else {
      return (
        <img src={url} alt={`解密文件 ${index}`} style={{ maxWidth: '100%' }} />
      )
    }
  }
  
  return (
    <div>
      <button 
        onClick={handleDecrypt}
        disabled={isLoading}
      >
        {isLoading ? "解密中..." : "解密并查看"}
      </button>
      
      {error && (
        <div style={{ color: 'red' }}>
          错误: {error}
        </div>
      )}
      
      {decryptedFiles.length > 0 && (
        <div>
          <h3>已解密的文件:</h3>
          {decryptedFiles.map((file, index) => (
            <div key={index}>
              {renderMedia(file.url, file.type, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}